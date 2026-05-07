import requests
from django.conf import settings
import logging
import mimetypes
import os
import json

logger = logging.getLogger(__name__)

class ZohoSignClient:
    """
    Client for Zoho Sign API.
    Handles authentication and core document signing processes para Contratos.
    """
    BASE_URL = getattr(settings, 'ZOHO_SIGN_BASE_URL', 'https://sign.zoho.com/api/v1')
    
    def __init__(self):
        # En settings.py se deberían configurar estas variables:
        # ZOHO_SIGN_CLIENT_ID, ZOHO_SIGN_CLIENT_SECRET, ZOHO_SIGN_REFRESH_TOKEN, etc.
        self.access_token = self._get_access_token()

    def _get_access_token(self):
        """
        Obtiene o refresca el token de acceso para autenticarse en Zoho Sign API.
        """
        zoho_accounts_url = getattr(settings, 'ZOHO_ACCOUNTS_URL', 'https://accounts.zoho.com/oauth/v2/token')
        refresh_token = getattr(settings, 'ZOHO_SIGN_REFRESH_TOKEN', '')
        client_id = getattr(settings, 'ZOHO_SIGN_CLIENT_ID', '')
        client_secret = getattr(settings, 'ZOHO_SIGN_CLIENT_SECRET', '')
        
        if not refresh_token:
            # Fallback a token estático si no hay configurado un refresh token (útil para pruebas)
            return getattr(settings, 'ZOHO_SIGN_ACCESS_TOKEN', '')

        payload = {
            'refresh_token': refresh_token,
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'refresh_token'
        }
        
        try:
            response = requests.post(zoho_accounts_url, data=payload)
            response.raise_for_status()
            data = response.json()
            return data.get('access_token')
        except Exception as e:
            logger.error(f"Error fetching Zoho access token: {str(e)}")
            return getattr(settings, 'ZOHO_SIGN_ACCESS_TOKEN', '')

    def _get_headers(self):
        return {
            'Authorization': f'Zoho-oauthtoken {self.access_token}'
        }

    def create_request_from_file(self, request_name, file_path, recipient_name, recipient_email):
        """
        Envía una petición de firma a partir de un archivo existente (e.g., Contrato.archivo.path).
        """
        url = f"{self.BASE_URL}/requests"
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")
            
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/pdf'
            
        file_name = os.path.basename(file_path)
        files = {
            'file': (file_name, open(file_path, 'rb'), mime_type)
        }
        
        # Payload de metadatos de configuración
        data_payload = {
            "requests": {
                "request_name": request_name,
                "action": [
                    {
                        "action_type": "SIGN",
                        "recipient_name": recipient_name,
                        "recipient_email": recipient_email,
                        "action_id": "verify",
                        "verify_recipient": False
                    }
                ]
            }
        }
        
        data = {
            'data': json.dumps(data_payload)
        }
        
        try:
            response = requests.post(url, headers=self._get_headers(), data=data, files=files)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating Zoho Sign request from file: {str(e)}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Zoho Sign API Response: {e.response.text}")
            raise e
        finally:
            files['file'][1].close()

    def create_request_from_template(self, template_id, target_name, target_email):
        """
        Opcional: Envía una petición de firma usando una plantilla ya configurada en Zoho Sign.
        """
        url = f"{self.BASE_URL}/templates/{template_id}/createdocument"
        
        payload = {
            "templates": {
                "actions": [
                    {
                        "action_type": "SIGN",
                        "recipient_name": target_name,
                        "recipient_email": target_email,
                        "role": "Agente" # Adjust role based on your template configurations
                    }
                ]
            }
        }
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error creating Zoho Sign document from template: {str(e)}")
            raise e

    def get_request_status(self, request_id):
        """
        Obtiene el estado actual y detalles de una petición de firma.
        """
        url = f"{self.BASE_URL}/requests/{request_id}"
        try:
            response = requests.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching Zoho Sign request status: {str(e)}")
            raise e

    def download_signed_document(self, request_id):
        """
        Descarga el documento firmado como un listado de bytes (PDF data).
        Ideal para guardar directamente en Contrato.archivo.save().
        """
        url = f"{self.BASE_URL}/requests/{request_id}/pdf"
        try:
            response = requests.get(url, headers=self._get_headers(), stream=True)
            response.raise_for_status()
            return response.content # Returns raw PDF bytes
        except Exception as e:
            logger.error(f"Error downloading signed document from Zoho Sign: {str(e)}")
            raise e
