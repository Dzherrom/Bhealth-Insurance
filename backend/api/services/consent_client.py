import hmac
import hashlib
import json
import logging
from django.conf import settings
from datetime import datetime, timedelta
import requests

logger = logging.getLogger(__name__)

class ConsentClient:
    """
    Cliente API para la integración de firma electrónica (Consent).
    Reemplazar con la implementación específica del proveedor final.
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'CONSENT_BASE_URL', 'https://api.example-consent.com')
        self.api_key = getattr(settings, 'CONSENT_API_KEY', '')
        self.webhook_secret = getattr(settings, 'CONSENT_WEBHOOK_SECRET', '')
        self.timeout = getattr(settings, 'CONSENT_TIMEOUT_SECONDS', 10)
        
    def _get_headers(self):
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
    def create_envelope(self, poliza_id, signer_name, signer_email, document_template_id=None):
        """
        Inicia un proceso de firma
        """
        # Endpoint ficticio
        url = f"{self.base_url}/v1/envelopes"
        payload = {
            "referenceId": poliza_id,
            "signer": {
                "name": signer_name,
                "email": signer_email
            }
        }
        
        # En modo debug/local, simulamos respuesta exitosa si no hay API real
        if self.api_key == 'dummy_api_key_for_local_dev':
            import uuid
            return {
                "envelopeId": str(uuid.uuid4()),
                "status": "ENVIADO",
                "signingUrl": f"https://sandbox.example.com/sign/{uuid.uuid4()}"
            }
            
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            return {
                "envelopeId": data.get('envelopeId'),
                "status": data.get('status', 'ENVIADO'),
                "signingUrl": data.get('signingUrl', '')
            }
        except requests.RequestException as e:
            logger.error(f"Error creating consent envelope: {e}")
            raise Exception("No se pudo iniciar el proceso de firma con el proveedor.")
            
    def get_status(self, envelope_id):
        """
        Consulta estado de la firma
        """
        if self.api_key == 'dummy_api_key_for_local_dev':
            return "ENVIADO"
            
        url = f"{self.base_url}/v1/envelopes/{envelope_id}"
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.json().get('status')
        except requests.RequestException as e:
            logger.error(f"Error getting envelope status: {e}")
            return "ERROR"
            
    def download_signed_document(self, envelope_id):
        """
        Descarga el PDF firmado. Retorna contenido binario (bytes)
        """
        if self.api_key == 'dummy_api_key_for_local_dev':
            # Simula un PDF
            return b"%PDF-1.4... (Contenido simulado) ..."
            
        url = f"{self.base_url}/v1/envelopes/{envelope_id}/document"
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=self.timeout)
            response.raise_for_status()
            return response.content
        except requests.RequestException as e:
            logger.error(f"Error downloading signed document: {e}")
            raise Exception("No se pudo descargar el documento firmado")

    def verify_webhook_signature(self, payload_body, signature_header):
        """
        Verifica la firma criptográfica del webhook
        (Adaptar al método del proveedor, usualmente HMAC SHA256)
        """
        if self.api_key == 'dummy_api_key_for_local_dev':
            return True
            
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload_body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature_header)
