
import csv
import os
from django.core.management.base import BaseCommand
from api.models import Poliza, PolizaCliente

class Command(BaseCommand):
    help = 'Export policies to CSV files'

    def add_arguments(self, parser):
        parser.add_argument('--format', type=str, help='Format of the CSV: simple or complete')
        parser.add_argument('--output', type=str, help='Output file path')

    def handle(self, *args, **options):
        format_type = options['format']
        output_path = options['output']

        if not format_type or not output_path:
            self.stdout.write(self.style.ERROR('Please provide --format and --output arguments'))
            return

        if format_type == 'simple':
            self.export_simple_csv(output_path)
        elif format_type == 'complete':
            self.export_complete_csv(output_path)
        else:
            self.stdout.write(self.style.ERROR(f'Unknown format: {format_type}'))

    def export_simple_csv(self, output_path):
        headers = [
            'AGENT', 'AGENT NPN', 'BROKER/AGENCY', 'FULL NAME', 'FIRST NAME', 'MIDDLE NAME', 
            'LAST NAME', 'SECOND LAST NAME', 'DATE OF BIRTH', 'PHONE', 'EMAIL', 'STATE', 'ZIP', 
            'CARRIER/ISSUER', 'PLAN', 'PLAN ID', 'MEMBER ID', 'APPLICANTS', 'MONTHLY PREMIUM', 
            'EFFECTIVE DATE', 'STATUS', 'ASSIGNED TO', 'SUBMITTED', 'LAST UPDATE', 'IS DUPLICATE', 
            'LAST DUPLICATE', 'INTERNAL CODE'
        ]

        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(headers)

            polizas = Poliza.objects.all().select_related(
                'agente', 'agente__agencia', 'plan', 'plan__aseguradora', 'estado'
            ).prefetch_related('polizacliente_set__cliente', 'polizacliente_set__direccion_residencia')

            for poliza in polizas:
                # Find main applicant
                main_applicant_relation = poliza.polizacliente_set.filter(es_solicitante_principal=True).first()
                if not main_applicant_relation:
                    # Fallback if no main applicant marked (should not happen ideally)
                    main_applicant_relation = poliza.polizacliente_set.first()
                
                if not main_applicant_relation:
                    continue

                cliente = main_applicant_relation.cliente
                direccion = main_applicant_relation.direccion_residencia

                row = [
                    poliza.agente.nombre_completo if poliza.agente else '',
                    poliza.agente.npn if poliza.agente else '',
                    poliza.agente.agencia.nombre if poliza.agente and poliza.agente.agencia else '',
                    f"{cliente.primer_nombre} {cliente.apellido_paterno}",
                    cliente.primer_nombre,
                    cliente.segundo_nombre if cliente.segundo_nombre else '', # MIDDLE NAME
                    cliente.apellido_paterno,
                    cliente.apellido_materno if cliente.apellido_materno else '', # SECOND LAST NAME
                    cliente.fecha_nacimiento,
                    cliente.telefono,
                    cliente.email,
                    direccion.estado if direccion else '',
                    direccion.zip_code if direccion else '',
                    poliza.plan.aseguradora.nombre if poliza.plan and poliza.plan.aseguradora else '',
                    poliza.plan.nombre if poliza.plan else '',
                    poliza.plan.id_plan_aseguradora if poliza.plan else '',
                    poliza.id_miembro,
                    poliza.clientes.count(),
                    poliza.prima_mensual,
                    poliza.fecha_efectiva,
                    poliza.estado.nombre if poliza.estado else '',
                    poliza.agente.nombre_completo if poliza.agente else '', # ASSIGNED TO
                    poliza.fecha_envio,
                    poliza.ultima_actualizacion, # LAST UPDATE
                    'Yes' if poliza.es_duplicado else 'No', # IS DUPLICATE
                    poliza.ultimo_duplicado if poliza.ultimo_duplicado else '', # LAST DUPLICATE
                    poliza.id_interno
                ]
                writer.writerow(row)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully exported simple CSV to {output_path}'))

    def export_complete_csv(self, output_path):
        # Main Applicant Headers
        main_headers = [
            'AGENT', 'AGENT NPN', 'BROKER/AGENCY', 'IS APPLICANT', 'FULL NAME', 'FIRST NAME', 
            'MIDDLE NAME', 'LAST NAME', 'SECOND LAST NAME', 'GENDER', 'DATE OF BIRTH', 'PHONE', 
            'EMAIL', 'ANNUAL INCOME', 'MARITAL STATUS', 'SSN', 'COUNTRY OF BIRTH', 'IMMIGRATION STATUS', 
            'IMMIGRATION CATEGORY', 'ADDRESS 1', 'ADDRESS 2', 'CITY', 'STATE', 'ZIP', 'COUNTY', 
            'MAILING ADDRESS 1', 'MAILING ADDRESS 2', 'MAILING CITY', 'MAILING STATE', 'MAILING ZIP', 
            'MAILING COUNTY', 'CARRIER/ISSUER', 'PLAN', 'PLAN ID', 'MARKETPLACE ID', 'MEMBER ID', 
            'APPLICANTS', 'POLICY COST', 'SUBSIDY', 'MONTHLY PREMIUM', 'EFFECTIVE DATE', 'STATUS', 
            'ASSIGNED TO', 'SUBMITTED', 'LAST UPDATE', 'CANCELLATION DATE', 'IS DUPLICATE', 
            'LAST DUPLICATE', 'NPN USED IN MARKETPLACE', 'FFM USED IN MARKETPLACE', 'INTERNAL CODE'
        ]

        # Dependent Headers (Repeated block)
        dependent_headers = [
            'IS APPLICANT', 'RELATIONSHIP', 'FIRST NAME', 'MIDDLE NAME', 'LAST NAME', 
            'SECOND LAST NAME', 'GENDER', 'DATE OF BIRTH', 'PHONE', 'EMAIL', 'ANNUAL INCOME', 
            'MARITAL STATUS', 'SSN', 'COUNTRY OF BIRTH', 'IMMIGRATION STATUS', 'IMMIGRATION CATEGORY'
        ]

        # Determine max dependents to set fixed columns or dynamic? 
        # Requirement says: "blocks repeated for each dependent/additional member... (up to 20 times or as needed)"
        # I will scan for max dependents first to be safe, or just fix it to 20 as suggested.
        # Let's fix to 10 for now to avoid huge files if not needed, or calculate max.
        # Better to calculate max dependents in the queryset to be precise.
        
        max_dependents = 0
        polizas = Poliza.objects.all().prefetch_related('polizacliente_set')
        for p in polizas:
            # Count dependents (total - 1 main applicant)
            count = p.polizacliente_set.count() - 1
            if count > max_dependents:
                max_dependents = count
        
        # If max_dependents is 0, we still might want at least one block? No, just follow data.
        # Requirement says "up to 20 times". Let's cap at 20 or use max found.
        max_dependents = max(max_dependents, 1) # Ensure at least one block if needed, or just 0.
        
        all_headers = main_headers + (dependent_headers * max_dependents)

        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(all_headers)

            polizas = Poliza.objects.all().select_related(
                'agente', 'agente__agencia', 'plan', 'plan__aseguradora', 'estado'
            ).prefetch_related(
                'polizacliente_set__cliente', 
                'polizacliente_set__direccion_residencia',
                'polizacliente_set__direccion_postal'
            )

            for poliza in polizas:
                # Find main applicant
                main_applicant_relation = poliza.polizacliente_set.filter(es_solicitante_principal=True).first()
                if not main_applicant_relation:
                    main_applicant_relation = poliza.polizacliente_set.first()
                
                if not main_applicant_relation:
                    continue

                cliente = main_applicant_relation.cliente
                res_addr = main_applicant_relation.direccion_residencia
                mail_addr = main_applicant_relation.direccion_postal

                # Main Applicant Data
                row = [
                    poliza.agente.nombre_completo if poliza.agente else '',
                    poliza.agente.npn if poliza.agente else '',
                    poliza.agente.agencia.nombre if poliza.agente and poliza.agente.agencia else '',
                    'Yes', # IS APPLICANT
                    f"{cliente.primer_nombre} {cliente.apellido_paterno}",
                    cliente.primer_nombre,
                    cliente.segundo_nombre if cliente.segundo_nombre else '', # MIDDLE NAME
                    cliente.apellido_paterno,
                    cliente.apellido_materno if cliente.apellido_materno else '', # SECOND LAST NAME
                    cliente.genero,
                    cliente.fecha_nacimiento,
                    cliente.telefono,
                    cliente.email,
                    cliente.ingreso_anual,
                    cliente.estado_civil,
                    cliente.ssn,
                    cliente.pais_nacimiento,
                    cliente.estado_inmigracion,
                    cliente.categoria_inmigracion if cliente.categoria_inmigracion else '', # IMMIGRATION CATEGORY
                    res_addr.linea1 if res_addr else '',
                    res_addr.linea2 if res_addr else '',
                    res_addr.ciudad if res_addr else '',
                    res_addr.estado if res_addr else '',
                    res_addr.zip_code if res_addr else '',
                    res_addr.condado if res_addr else '',
                    mail_addr.linea1 if mail_addr else '',
                    mail_addr.linea2 if mail_addr else '',
                    mail_addr.ciudad if mail_addr else '',
                    mail_addr.estado if mail_addr else '',
                    mail_addr.zip_code if mail_addr else '',
                    mail_addr.condado if mail_addr else '',
                    poliza.plan.aseguradora.nombre if poliza.plan and poliza.plan.aseguradora else '',
                    poliza.plan.nombre if poliza.plan else '',
                    poliza.plan.id_plan_aseguradora if poliza.plan else '',
                    poliza.id_mercado,
                    poliza.id_miembro,
                    poliza.clientes.count(),
                    poliza.costo_poliza,
                    poliza.subsidio,
                    poliza.prima_mensual,
                    poliza.fecha_efectiva,
                    poliza.estado.nombre if poliza.estado else '',
                    poliza.agente.nombre_completo if poliza.agente else '',
                    poliza.fecha_envio,
                    poliza.ultima_actualizacion, # LAST UPDATE
                    poliza.fecha_cancelacion if poliza.fecha_cancelacion else '',
                    'Yes' if poliza.es_duplicado else 'No', # IS DUPLICATE
                    poliza.ultimo_duplicado if poliza.ultimo_duplicado else '', # LAST DUPLICATE
                    poliza.agente.npn if poliza.agente else '', # NPN USED IN MARKETPLACE
                    poliza.ffm_mercado if poliza.ffm_mercado else '', # FFM USED IN MARKETPLACE
                    poliza.id_interno
                ]

                # Dependents Data
                dependents = poliza.polizacliente_set.exclude(id=main_applicant_relation.id)
                
                for dep_rel in dependents:
                    dep = dep_rel.cliente
                    row.extend([
                        'No', # IS APPLICANT
                        dep_rel.relacion,
                        dep.primer_nombre,
                        dep.segundo_nombre if dep.segundo_nombre else '', # MIDDLE NAME
                        dep.apellido_paterno,
                        dep.apellido_materno if dep.apellido_materno else '', # SECOND LAST NAME
                        dep.genero,
                        dep.fecha_nacimiento,
                        dep.telefono,
                        dep.email,
                        dep.ingreso_anual,
                        dep.estado_civil,
                        dep.ssn,
                        dep.pais_nacimiento,
                        dep.estado_inmigracion,
                        dep.categoria_inmigracion if dep.categoria_inmigracion else '' # IMMIGRATION CATEGORY
                    ])
                
                # Fill remaining columns if fewer dependents than max
                remaining_dependents = max_dependents - dependents.count()
                if remaining_dependents > 0:
                    row.extend([''] * len(dependent_headers) * remaining_dependents)

                writer.writerow(row)

        self.stdout.write(self.style.SUCCESS(f'Successfully exported complete CSV to {output_path}'))
