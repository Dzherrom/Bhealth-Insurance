import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework import permissions
from .models import Poliza

class ExportPolizasView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="polizas_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID Mercado', 'ID Miembro', 'Aseguradora', 'Agente', 'Cliente Principal', 'Estado', 'Subsidio', 'P. Mensual', 'Total Ahorros', 'Tipo Inscripcion', 'Fecha Efectiva'])

        polizas = Poliza.objects.select_related('plan__aseguradora', 'agente', 'estado').all()
        for p in polizas:
            cliente_prin = next((cp for cp in p.polizacliente_set.all() if cp.es_solicitante_principal), None)
            cliente_nombre = cliente_prin.cliente.nombre_completo if cliente_prin else "Sin Cliente"
            writer.writerow([
                p.id_mercado,
                p.id_miembro,
                p.plan.aseguradora.nombre if p.plan else "",
                p.agente.nombre_completo if p.agente else "",
                cliente_nombre,
                p.estado.nombre if p.estado else "",
                p.subsidio,
                p.prima_mensual,
                p.total_ahorros,
                p.tipo_inscripcion,
                p.fecha_efectiva
            ])
            
        return response
