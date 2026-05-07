from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.core.files.base import ContentFile

from .models import ConsentRequest, ConsentEvent, Poliza, Cliente, Documento, registrar_auditoria_global
from .serializers_consent import ConsentRequestSerializer
from .services.consent_client import ConsentClient

class ConsentRequestViewSet(viewsets.ModelViewSet):
    queryset = ConsentRequest.objects.all()
    serializer_class = ConsentRequestSerializer
    permission_classes = [permissions.IsAuthenticated] # Add proper role if needed
    
    def get_queryset(self):
        # Filtrar por cliente o póliza si vienen en query params
        qs = super().get_queryset()
        poliza_id = self.request.query_params.get('poliza')
        if poliza_id:
            qs = qs.filter(poliza_id=poliza_id)
        return qs
        
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    @action(detail=True, methods=['post'])
    def initiate(self, request, pk=None):
        """
        Envía la solicitud de firma usando el ConsentClient
        """
        consent_req = self.get_object()
        
        if consent_req.status not in ['BORRADOR', 'ERROR', 'RECHAZADO', 'EXPIRADO']:
            return Response({"detail": "La solicitud ya está en proceso"}, status=status.HTTP_400_BAD_REQUEST)
            
        client = ConsentClient()
        try:
            result = client.create_envelope(
                poliza_id=str(consent_req.poliza.id_mercado),
                signer_name=consent_req.signer_name,
                signer_email=consent_req.signer_email
            )
            
            # Actualizamos Request
            consent_req.provider_envelope_id = result.get('envelopeId')
            consent_req.status = result.get('status', 'ENVIADO')
            consent_req.signing_url = result.get('signingUrl')
            consent_req.sent_at = timezone.now()
            consent_req.save()
            
            registrar_auditoria_global(
                usuario=request.user,
                accion='CONSENT_INICIAR',
                modelo='ConsentRequest',
                objeto_id=consent_req.id,
                detalles=f"Firma iniciada para póliza {consent_req.poliza.id_mercado}"
            )
            
            return Response(self.get_serializer(consent_req).data)
            
        except Exception as e:
            consent_req.status = 'ERROR'
            consent_req.last_error = str(e)
            consent_req.save()
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def webhook(self, request):
        """
        Webhook para recibir actualizaciones del proveedor de firma.
        (Abierto sin auth base, validamos por firma secreta)
        """
        client = ConsentClient()
        # Verificar firma de webhook
        signature = request.headers.get('X-Consent-Signature', '')
        payload_body = request.body
        
        signature_valid = client.verify_webhook_signature(payload_body, signature)
        
        # Idempotencia: asumimos payload trae 'eventId' (uuid)
        event_id = request.data.get('eventId', 'dummy-id')
        event_type = request.data.get('eventType', 'UNKNOWN')
        envelope_id = request.data.get('envelopeId')
        
        # Omitimos duplicados
        if ConsentEvent.objects.filter(event_id=event_id).exists():
            return Response({"status": "already processed"}, status=status.HTTP_200_OK)
            
        consent_req = None
        if envelope_id:
            consent_req = ConsentRequest.objects.filter(provider_envelope_id=envelope_id).first()
            
        # Registrar evento
        event = ConsentEvent.objects.create(
            consent_request=consent_req,
            event_id=event_id,
            event_type=event_type,
            payload=request.data,
            signature_valid=signature_valid
        )

        if not signature_valid and client.api_key != 'dummy_api_key_for_local_dev':
            # Ignoramos la actualización de estado si la firma del webhook no es válida, 
            # pero guardamos el evento para auditoría.
            return Response({"detail": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Lógica de reconciliación de negocio
        if consent_req:
            if event_type == 'ENVELOPE_COMPLETED' or event_type == 'FIRMADO':
                consent_req.status = 'FIRMADO'
                consent_req.signed_at = timezone.now()
                
                # Bajar documento
                try:
                    pdf_bytes = client.download_signed_document(envelope_id)
                    doc_nombre = f"Consentimiento_{consent_req.poliza.id_mercado}_{timezone.now().strftime('%Y%m%d%H%M%S')}.pdf"
                    
                    doc = Documento.objects.create(
                        poliza=consent_req.poliza,
                        cliente=consent_req.cliente,
                        titulo=doc_nombre,
                        categoria='CONSENTIMIENTO',
                        # no subido_por porque es webhook del sistema (o None o Admin user)
                    )
                    doc.archivo.save(doc_nombre, ContentFile(pdf_bytes))
                    
                    consent_req.documento_generado = doc
                    
                except Exception as e:
                    consent_req.last_error = f"Error descargando documento final: {str(e)}"
                    consent_req.status = 'ERROR'
                    
            elif event_type in ['REJECTED', 'DECLINED']:
                consent_req.status = 'RECHAZADO'
            elif event_type == 'EXPIRED':
                consent_req.status = 'EXPIRADO'
                
            consent_req.save()
            
        return Response({"status": "received"}, status=status.HTTP_200_OK)