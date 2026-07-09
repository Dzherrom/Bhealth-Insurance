import mimetypes

from django.contrib.auth.models import User
from django.http import FileResponse
from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .client_portal import (
    CLIENT_CAMPO_LABELS,
    CLIENT_EDITABLE_FIELDS,
    DOCUMENTO_CATEGORIA_LABELS,
    format_direccion,
    get_polizas_for_cliente,
    get_primary_poliza_for_cliente,
    map_campo_to_tipo,
    resolve_cliente_for_user,
    user_owns_poliza,
)
from .models import CambioDeVida, Cliente, Documento, Poliza, PolizaCliente
from .permissions import IsClienteRole

PORTAL_EDITABLE_ESTADOS = frozenset({'PENDIENTE', 'EN_PROCESO'})
PORTAL_EDITABLE_DOC_ESTADOS = frozenset({'PENDIENTE_REVISION', 'SUBIDO'})


def _cambio_es_editable(cambio, user) -> bool:
    datos = cambio.datos or {}
    return (
        cambio.creado_por_id == user.id
        and cambio.estado in PORTAL_EDITABLE_ESTADOS
        and datos.get('origen') == 'PORTAL_CLIENTE'
    )


def _documento_es_editable(documento, user) -> bool:
    return (
        documento.subido_por_id == user.id
        and documento.estado_documento in PORTAL_EDITABLE_DOC_ESTADOS
    )


def _serialize_poliza_summary(poliza, cliente) -> dict:
    link = PolizaCliente.objects.filter(poliza=poliza, cliente=cliente).first()
    return {
        'id': poliza.id,
        'tipo_producto': poliza.tipo_producto.nombre if poliza.tipo_producto_id else None,
        'aseguradora': poliza.aseguradora.nombre if poliza.aseguradora_id else None,
        'estatus': poliza.estado.nombre if poliza.estado_id else None,
        'plan': poliza.nombre_plan or (poliza.plan.nombre if poliza.plan_id else None),
        'prima_mensual': str(poliza.prima_mensual),
        'costo_poliza': str(poliza.costo_poliza),
        'subsidio': str(poliza.subsidio),
        'fecha_efectiva': poliza.fecha_efectiva.isoformat() if poliza.fecha_efectiva else None,
        'id_mercado': poliza.id_mercado,
        'metal': poliza.metal,
        'es_principal': bool(link and link.es_solicitante_principal),
    }


class ClienteRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)


class ClienteSolicitudCambioSerializer(serializers.Serializer):
    poliza_id = serializers.IntegerField()
    campos = serializers.DictField(child=serializers.JSONField(), allow_empty=False)
    descripcion = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate_campos(self, value):
        if not value:
            raise serializers.ValidationError('Debe indicar al menos un campo a modificar.')
        invalid = set(value.keys()) - CLIENT_EDITABLE_FIELDS
        if invalid:
            raise serializers.ValidationError(
                f'Campos no permitidos: {", ".join(sorted(invalid))}'
            )

        if 'miembro_familiar' in value:
            payload = value['miembro_familiar']
            if not isinstance(payload, dict):
                raise serializers.ValidationError({'miembro_familiar': 'Formato inválido.'})
            required = {'cliente_id', 'campo', 'valor'}
            missing = required - set(payload.keys())
            if missing:
                raise serializers.ValidationError({
                    'miembro_familiar': f'Faltan campos: {", ".join(sorted(missing))}'
                })

        if 'tarjetas_digitales' in value:
            self._validate_tarjeta_solicitud(value['tarjetas_digitales'])

        if 'cuentas_bancarias' in value:
            self._validate_cuenta_solicitud(value['cuentas_bancarias'])

        return value

    @staticmethod
    def _validate_tarjeta_solicitud(payload):
        if not isinstance(payload, dict):
            raise serializers.ValidationError({'tarjetas_digitales': 'Formato inválido.'})
        accion = payload.get('accion')
        if accion not in ('AGREGAR', 'EDITAR'):
            raise serializers.ValidationError({'tarjetas_digitales': 'La acción debe ser AGREGAR o EDITAR.'})
        if accion == 'EDITAR' and not payload.get('tarjeta_id'):
            raise serializers.ValidationError({'tarjetas_digitales': 'tarjeta_id es obligatorio para editar.'})
        datos = payload.get('datos')
        if not isinstance(datos, dict):
            raise serializers.ValidationError({'tarjetas_digitales': 'datos de tarjeta requeridos.'})
        required_base = {'tipo_tarjeta', 'nombre_titular', 'fecha_vencimiento'}
        missing = required_base - set(datos.keys())
        if missing:
            raise serializers.ValidationError({
                'tarjetas_digitales': f'Faltan campos: {", ".join(sorted(missing))}'
            })
        if accion == 'AGREGAR':
            for field in ('numero', 'cvv'):
                if not str(datos.get(field, '')).strip():
                    raise serializers.ValidationError({
                        'tarjetas_digitales': f'{field} es obligatorio al agregar una tarjeta.'
                    })

    @staticmethod
    def _validate_cuenta_solicitud(payload):
        if not isinstance(payload, dict):
            raise serializers.ValidationError({'cuentas_bancarias': 'Formato inválido.'})
        accion = payload.get('accion')
        if accion not in ('AGREGAR', 'EDITAR'):
            raise serializers.ValidationError({'cuentas_bancarias': 'La acción debe ser AGREGAR o EDITAR.'})
        if accion == 'EDITAR' and not payload.get('cuenta_id'):
            raise serializers.ValidationError({'cuentas_bancarias': 'cuenta_id es obligatorio para editar.'})
        datos = payload.get('datos')
        if not isinstance(datos, dict):
            raise serializers.ValidationError({'cuentas_bancarias': 'datos de cuenta requeridos.'})
        if not str(datos.get('nombre_banco', '')).strip() or not str(datos.get('titular_cuenta', '')).strip():
            raise serializers.ValidationError({
                'cuentas_bancarias': 'nombre_banco y titular_cuenta son obligatorios.'
            })
        if accion == 'AGREGAR':
            for field in ('numero_cuenta', 'aba_routing'):
                if not str(datos.get(field, '')).strip():
                    raise serializers.ValidationError({
                        'cuentas_bancarias': f'{field} es obligatorio al agregar una cuenta.'
                    })

    def validate_poliza_id(self, value):
        request = self.context['request']
        try:
            poliza = Poliza.objects.select_related('agente').get(pk=value)
        except Poliza.DoesNotExist as exc:
            raise serializers.ValidationError('Póliza no encontrada.') from exc

        if not user_owns_poliza(request.user, poliza):
            raise serializers.ValidationError('No tiene permiso para solicitar cambios en esta póliza.')

        if 'miembro_familiar' in self.initial_data.get('campos', {}):
            payload = self.initial_data['campos']['miembro_familiar']
            cliente_id = payload.get('cliente_id')
            if not PolizaCliente.objects.filter(poliza=poliza, cliente_id=cliente_id).exists():
                raise serializers.ValidationError(
                    'El familiar seleccionado no pertenece a esta póliza.'
                )

        self.context['poliza'] = poliza
        return value

    def create(self, validated_data):
        request = self.context['request']
        poliza = self.context['poliza']
        campos = validated_data['campos']
        descripcion = validated_data.get('descripcion', '').strip()

        first_campo = next(iter(campos.keys()))
        tipo = map_campo_to_tipo(first_campo)
        if len(campos) > 1:
            tipo = 'OTROS'

        if 'miembro_familiar' in campos:
            payload = campos['miembro_familiar']
            if isinstance(payload, dict) and payload.get('cliente_id'):
                miembro = Cliente.objects.filter(pk=payload['cliente_id']).first()
                if miembro:
                    campos['miembro_familiar'] = {
                        **payload,
                        'miembro_nombre': f'{miembro.primer_nombre} {miembro.apellido_paterno}'.strip(),
                    }

        cambio = CambioDeVida.objects.create(
            poliza=poliza,
            agente=poliza.agente,
            agente_creador=None,
            tipo=tipo,
            descripcion=descripcion or 'Solicitud de actualización desde portal del cliente',
            datos={
                'origen': 'PORTAL_CLIENTE',
                'campos_solicitados': campos,
            },
            estado='PENDIENTE',
            creado_por=request.user,
        )
        return cambio


class ClienteSolicitudDocumentoSerializer(serializers.Serializer):
    poliza_id = serializers.IntegerField()
    titulo = serializers.CharField(max_length=255)
    categoria = serializers.ChoiceField(
        choices=[choice[0] for choice in Documento.CATEGORIA_CHOICES],
        default='OTRO',
    )
    archivo = serializers.FileField()
    comentario = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    miembro_cliente_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_poliza_id(self, value):
        request = self.context['request']
        try:
            poliza = Poliza.objects.select_related('agente').get(pk=value)
        except Poliza.DoesNotExist as exc:
            raise serializers.ValidationError('Póliza no encontrada.') from exc

        if not user_owns_poliza(request.user, poliza):
            raise serializers.ValidationError('No tiene permiso para enviar documentos a esta póliza.')

        self.context['poliza'] = poliza
        return value

    def validate(self, attrs):
        poliza = self.context['poliza']
        miembro_id = attrs.get('miembro_cliente_id')
        if miembro_id and not PolizaCliente.objects.filter(poliza=poliza, cliente_id=miembro_id).exists():
            raise serializers.ValidationError({
                'miembro_cliente_id': 'El familiar seleccionado no pertenece a esta póliza.',
            })
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        poliza = self.context['poliza']
        miembro_id = validated_data.pop('miembro_cliente_id', None)
        cliente = resolve_cliente_for_user(request.user)
        if miembro_id:
            cliente = Cliente.objects.get(pk=miembro_id)
        comentario = validated_data.get('comentario', '').strip()

        documento = Documento.objects.create(
            poliza=poliza,
            cliente=cliente,
            titulo=validated_data['titulo'].strip(),
            categoria=validated_data['categoria'],
            archivo=validated_data['archivo'],
            estado_documento='PENDIENTE_REVISION',
            subido_por=request.user,
        )

        CambioDeVida.objects.create(
            poliza=poliza,
            agente=poliza.agente,
            agente_creador=None,
            tipo='OTROS',
            descripcion=comentario or 'Documento enviado desde portal del cliente para revisión.',
            datos={
                'origen': 'PORTAL_CLIENTE',
                'tipo_solicitud': 'DOCUMENTO',
                'documento_id': documento.id,
                'titulo': documento.titulo,
                'categoria': documento.categoria,
                'miembro_cliente_id': cliente.id if cliente else None,
                'miembro_nombre': (
                    f'{cliente.primer_nombre} {cliente.apellido_paterno}'.strip()
                    if cliente else None
                ),
            },
            estado='PENDIENTE',
            creado_por=request.user,
        )

        return documento


class ClienteSolicitudUpdateSerializer(serializers.Serializer):
    descripcion = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    campos = serializers.DictField(child=serializers.JSONField(), required=False)

    def validate_campos(self, value):
        if not value:
            return value
        invalid = set(value.keys()) - CLIENT_EDITABLE_FIELDS
        if invalid:
            raise serializers.ValidationError(
                f'Campos no permitidos: {", ".join(sorted(invalid))}'
            )
        return value


class ClienteDocumentoUpdateSerializer(serializers.Serializer):
    titulo = serializers.CharField(max_length=255, required=False)
    categoria = serializers.ChoiceField(
        choices=[choice[0] for choice in Documento.CATEGORIA_CHOICES],
        required=False,
    )
    comentario = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    archivo = serializers.FileField(required=False)


class PortalClienteDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]

    @staticmethod
    def _mask_card(numero: str | None) -> str | None:
        if not numero:
            return None
        digits = ''.join(ch for ch in str(numero) if ch.isdigit())
        if len(digits) < 4:
            return '****'
        return f'**** **** **** {digits[-4:]}'

    @staticmethod
    def _mask_account(numero: str | None) -> str | None:
        if not numero:
            return None
        digits = ''.join(ch for ch in str(numero) if ch.isdigit())
        if len(digits) < 4:
            return '****'
        return f'****{digits[-4:]}'

    @staticmethod
    def _format_cambio_resumen(cambio) -> str:
        datos = cambio.datos or {}
        if datos.get('tipo_solicitud') == 'DOCUMENTO':
            categoria = datos.get('categoria') or ''
            categoria_label = DOCUMENTO_CATEGORIA_LABELS.get(categoria, categoria)
            titulo = datos.get('titulo') or 'Documento enviado'
            miembro = datos.get('miembro_nombre')
            prefix = f'{miembro}: ' if miembro else ''
            return f'{prefix}{titulo}' + (f' ({categoria_label})' if categoria_label else '')

        campos = datos.get('campos_solicitados') or {}
        if 'miembro_familiar' in campos:
            payload = campos['miembro_familiar']
            if isinstance(payload, dict):
                campo = payload.get('campo', 'dato')
                valor = payload.get('valor', '')
                miembro = payload.get('miembro_nombre') or 'Familiar'
                return f'{miembro} — {campo}: {valor}'

        if 'tarjetas_digitales' in campos:
            payload = campos['tarjetas_digitales']
            if isinstance(payload, dict):
                accion = payload.get('accion', 'CAMBIO')
                datos = payload.get('datos') or {}
                titular = datos.get('nombre_titular') or 'Tarjeta'
                tipo = datos.get('tipo_tarjeta') or ''
                verbo = 'Agregar' if accion == 'AGREGAR' else 'Editar'
                return f'{verbo} tarjeta: {titular}' + (f' ({tipo})' if tipo else '')

        if 'cuentas_bancarias' in campos:
            payload = campos['cuentas_bancarias']
            if isinstance(payload, dict):
                accion = payload.get('accion', 'CAMBIO')
                datos = payload.get('datos') or {}
                banco = datos.get('nombre_banco') or 'Cuenta bancaria'
                verbo = 'Agregar' if accion == 'AGREGAR' else 'Editar'
                return f'{verbo} cuenta: {banco}'

        if campos:
            campo_key = next(iter(campos))
            label = CLIENT_CAMPO_LABELS.get(campo_key, campo_key.replace('_', ' ').title())
            valor = campos[campo_key]
            return f'{label}: {valor}'

        return cambio.descripcion or cambio.get_tipo_display()

    @staticmethod
    def _build_elegibilidad(cliente, poliza) -> dict:
        return {
            'estado_inmigracion': cliente.estado_inmigracion,
            'categoria_inmigracion': cliente.categoria_inmigracion or '',
            'ingreso_anual': str(cliente.ingreso_anual),
            'estado_poliza': poliza.estado.nombre if poliza.estado_id else None,
            'elegible': True,
            'notas': 'Basado en la información registrada en su póliza activa.',
        }

    def get(self, request):
        try:
            return self._build_dashboard_response(request)
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Error en portal cliente dashboard')
            return Response(
                {'detail': 'No se pudo cargar la información del portal.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _resolve_poliza(self, cliente, poliza_id_raw):
        polizas = list(get_polizas_for_cliente(cliente))
        if not polizas:
            return None, polizas

        if poliza_id_raw:
            try:
                poliza_id = int(poliza_id_raw)
            except (TypeError, ValueError):
                poliza_id = None
            if poliza_id:
                for poliza in polizas:
                    if poliza.id == poliza_id:
                        return poliza, polizas

        primary = get_primary_poliza_for_cliente(cliente)
        return primary or polizas[0], polizas

    def _build_dashboard_response(self, request):
        cliente = resolve_cliente_for_user(request.user)
        if not cliente:
            return Response(
                {'detail': 'No se encontró un perfil de cliente vinculado a esta cuenta.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        poliza, polizas = self._resolve_poliza(cliente, request.query_params.get('poliza_id'))
        polizas_payload = [_serialize_poliza_summary(item, cliente) for item in polizas]

        if not poliza:
            return Response(
                {
                    'cliente_id': cliente.id,
                    'primer_nombre': cliente.primer_nombre,
                    'apellido_paterno': cliente.apellido_paterno,
                    'apellido_materno': cliente.apellido_materno,
                    'nombre_completo': f'{cliente.primer_nombre} {cliente.apellido_paterno}'.strip(),
                    'poliza': None,
                    'polizas': [],
                    'mensaje': 'No tiene pólizas registradas.',
                    'grupo_familiar': [],
                    'tarjetas_digitales': [],
                    'cuentas_bancarias': [],
                    'cambios_pendientes': [],
                    'documentos_solicitados': [],
                    'campos_editables': sorted(
                field for field in CLIENT_EDITABLE_FIELDS
                if field not in {'miembro_familiar', 'tarjetas_digitales', 'cuentas_bancarias'}
            ),
                }
            )

        direccion = poliza.direccion_fisica or cliente.direccion_fisica
        grupo_familiar = []
        for link in poliza.polizacliente_set.select_related('cliente').all():
            member = link.cliente
            grupo_familiar.append({
                'cliente_id': member.id,
                'nombre': f'{member.primer_nombre} {member.apellido_paterno}'.strip(),
                'primer_nombre': member.primer_nombre,
                'apellido_paterno': member.apellido_paterno,
                'apellido_materno': member.apellido_materno,
                'relacion': link.relacion,
                'es_solicitante_principal': link.es_solicitante_principal,
                'fecha_nacimiento': member.fecha_nacimiento.isoformat() if member.fecha_nacimiento else None,
                'telefono': member.telefono,
                'email': member.email,
                'ingresos': str(member.ingreso_anual),
            })

        tarjetas = [
            {
                'id': tarjeta.id,
                'tipo_tarjeta': tarjeta.tipo_tarjeta,
                'numero_enmascarado': self._mask_card(tarjeta.numero),
                'nombre_titular': tarjeta.nombre_titular,
                'fecha_vencimiento': tarjeta.fecha_vencimiento,
                'es_predeterminado': tarjeta.es_predeterminado,
            }
            for tarjeta in poliza.tarjetas_credito.all()
        ]

        cuentas_bancarias = [
            {
                'id': cuenta.id,
                'nombre_banco': cuenta.nombre_banco,
                'numero_enmascarado': self._mask_account(cuenta.numero_cuenta),
                'titular_cuenta': cuenta.titular_cuenta,
                'aba_enmascarado': self._mask_account(cuenta.aba_routing),
                'es_predeterminado': cuenta.es_predeterminado,
            }
            for cuenta in poliza.cuentas_bancarias.all()
        ]

        cambios_pendientes = []
        for cambio in CambioDeVida.objects.filter(
            poliza=poliza,
            creado_por=request.user,
            estado__in=PORTAL_EDITABLE_ESTADOS,
        ).order_by('-fecha_creacion')[:30]:
            datos = cambio.datos or {}
            cambios_pendientes.append({
                'id': cambio.id,
                'tipo': cambio.tipo,
                'tipo_display': cambio.get_tipo_display(),
                'estado': cambio.estado,
                'estado_display': cambio.get_estado_display(),
                'descripcion': cambio.descripcion,
                'resumen': self._format_cambio_resumen(cambio),
                'tipo_solicitud': datos.get('tipo_solicitud'),
                'documento_id': datos.get('documento_id'),
                'fecha_creacion': cambio.fecha_creacion.isoformat() if cambio.fecha_creacion else None,
                'puede_modificar': _cambio_es_editable(cambio, request.user),
                'puede_eliminar': _cambio_es_editable(cambio, request.user),
            })

        agente = poliza.agente
        documentos_solicitados = []
        for documento in poliza.documentos.filter(subido_por=request.user).order_by('-fecha_subida')[:30]:
            editable = _documento_es_editable(documento, request.user)
            documentos_solicitados.append({
                'id': documento.id,
                'titulo': documento.titulo,
                'categoria': documento.categoria,
                'estado_documento': documento.estado_documento,
                'estado_display': documento.get_estado_documento_display(),
                'fecha_subida': documento.fecha_subida.isoformat() if documento.fecha_subida else None,
                'cliente_id': documento.cliente_id,
                'puede_modificar': editable,
                'puede_eliminar': editable,
                'tiene_archivo': bool(documento.archivo),
            })

        return Response({
            'cliente_id': cliente.id,
            'primer_nombre': cliente.primer_nombre,
            'apellido_paterno': cliente.apellido_paterno,
            'apellido_materno': cliente.apellido_materno,
            'nombre_completo': f'{cliente.primer_nombre} {cliente.apellido_paterno}'.strip(),
            'fecha_nacimiento': cliente.fecha_nacimiento.isoformat() if cliente.fecha_nacimiento else None,
            'direccion_completa': format_direccion(direccion),
            'telefono': cliente.telefono,
            'email': cliente.email,
            'ingresos': str(cliente.ingreso_anual),
            'grupo_familiar': grupo_familiar,
            'tarjetas_digitales': tarjetas,
            'cuentas_bancarias': cuentas_bancarias,
            'cambios_pendientes': cambios_pendientes,
            'elegibilidad': self._build_elegibilidad(cliente, poliza),
            'agente': {
                'nombre': agente.nombre_completo if agente else None,
                'npn': agente.npn if agente else None,
            },
            'polizas': polizas_payload,
            'poliza': _serialize_poliza_summary(poliza, cliente),
            'campos_editables': sorted(
                field for field in CLIENT_EDITABLE_FIELDS
                if field not in {'miembro_familiar', 'tarjetas_digitales', 'cuentas_bancarias'}
            ),
            'documentos_solicitados': documentos_solicitados,
        })


class ClienteSolicitudCambioView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]

    def post(self, request):
        serializer = ClienteSolicitudCambioSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        cambio = serializer.save()
        return Response(
            {
                'id': cambio.id,
                'tipo': cambio.tipo,
                'estado': cambio.estado,
                'poliza_id': cambio.poliza_id,
                'mensaje': 'Su solicitud de cambio fue enviada correctamente.',
            },
            status=status.HTTP_201_CREATED,
        )


class ClienteSolicitudDocumentoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        try:
            serializer = ClienteSolicitudDocumentoSerializer(
                data=request.data,
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            documento = serializer.save()
        except serializers.ValidationError:
            raise
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Error al solicitar documento portal cliente')
            return Response(
                {'detail': 'No se pudo procesar el documento. Intente nuevamente.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                'id': documento.id,
                'titulo': documento.titulo,
                'estado_documento': documento.estado_documento,
                'estado_display': documento.get_estado_documento_display(),
                'mensaje': 'Documento enviado correctamente. Un agente lo revisará pronto.',
            },
            status=status.HTTP_201_CREATED,
        )


class PortalClienteSolicitudDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]

    def _get_cambio(self, request, cambio_id):
        try:
            cambio = CambioDeVida.objects.select_related('poliza').get(pk=cambio_id)
        except CambioDeVida.DoesNotExist as exc:
            raise serializers.ValidationError({'detail': 'Solicitud no encontrada.'}) from exc

        if not user_owns_poliza(request.user, cambio.poliza):
            raise serializers.ValidationError({'detail': 'No autorizado.'})
        if not _cambio_es_editable(cambio, request.user):
            raise serializers.ValidationError({
                'detail': 'Esta solicitud ya no puede modificarse porque fue completada o cancelada.',
            })
        return cambio

    def patch(self, request, cambio_id):
        try:
            cambio = self._get_cambio(request, cambio_id)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = ClienteSolicitudUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if 'descripcion' in data:
            cambio.descripcion = data['descripcion'].strip() or cambio.descripcion

        if 'campos' in data and data['campos']:
            datos = cambio.datos or {}
            if datos.get('tipo_solicitud') == 'DOCUMENTO':
                return Response(
                    {'detail': 'Use la edición de documento para modificar solicitudes con archivo.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            datos['campos_solicitados'] = data['campos']
            cambio.datos = datos

        cambio.save()
        return Response({
            'id': cambio.id,
            'estado': cambio.estado,
            'mensaje': 'Solicitud actualizada correctamente.',
        })

    def delete(self, request, cambio_id):
        try:
            cambio = self._get_cambio(request, cambio_id)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        datos = cambio.datos or {}
        documento_id = datos.get('documento_id')
        if documento_id:
            documento = Documento.objects.filter(pk=documento_id, subido_por=request.user).first()
            if documento and _documento_es_editable(documento, request.user):
                documento.delete()

        cambio.estado = 'CANCELADO'
        cambio.save(update_fields=['estado', 'fecha_actualizacion'])
        return Response({'mensaje': 'Solicitud cancelada correctamente.'})


class PortalClienteDocumentoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]
    parser_classes = [MultiPartParser, FormParser]

    def _get_documento(self, request, documento_id):
        try:
            documento = Documento.objects.select_related('poliza').get(pk=documento_id)
        except Documento.DoesNotExist as exc:
            raise serializers.ValidationError({'detail': 'Documento no encontrado.'}) from exc

        if documento.subido_por_id != request.user.id or not user_owns_poliza(request.user, documento.poliza):
            raise serializers.ValidationError({'detail': 'No autorizado.'})
        if not _documento_es_editable(documento, request.user):
            raise serializers.ValidationError({
                'detail': 'Este documento ya no puede modificarse porque fue revisado.',
            })
        return documento

    def patch(self, request, documento_id):
        try:
            documento = self._get_documento(request, documento_id)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = ClienteDocumentoUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if 'titulo' in data:
            documento.titulo = data['titulo'].strip()
        if 'categoria' in data:
            documento.categoria = data['categoria']
        if 'archivo' in data:
            documento.archivo = data['archivo']
        documento.save()

        cambio = CambioDeVida.objects.filter(
            poliza=documento.poliza,
            creado_por=request.user,
            estado__in=PORTAL_EDITABLE_ESTADOS,
            datos__documento_id=documento.id,
        ).first()
        if cambio:
            datos = cambio.datos or {}
            datos['titulo'] = documento.titulo
            datos['categoria'] = documento.categoria
            cambio.datos = datos
            if 'comentario' in data:
                cambio.descripcion = data['comentario'].strip() or cambio.descripcion
            cambio.save()

        return Response({
            'id': documento.id,
            'titulo': documento.titulo,
            'estado_documento': documento.estado_documento,
            'mensaje': 'Documento actualizado correctamente.',
        })

    def delete(self, request, documento_id):
        try:
            documento = self._get_documento(request, documento_id)
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        CambioDeVida.objects.filter(
            poliza=documento.poliza,
            creado_por=request.user,
            estado__in=PORTAL_EDITABLE_ESTADOS,
            datos__documento_id=documento.id,
        ).update(estado='CANCELADO')

        documento.delete()
        return Response({'mensaje': 'Documento eliminado correctamente.'})


class PortalClienteDocumentoPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClienteRole]

    def get(self, request, documento_id):
        try:
            documento = Documento.objects.select_related('poliza').get(pk=documento_id)
        except Documento.DoesNotExist:
            return Response({'detail': 'Documento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if documento.subido_por_id != request.user.id or not user_owns_poliza(request.user, documento.poliza):
            return Response({'detail': 'No autorizado.'}, status=status.HTTP_403_FORBIDDEN)

        if not documento.archivo:
            return Response({'detail': 'Archivo no disponible.'}, status=status.HTTP_404_NOT_FOUND)

        content_type, _ = mimetypes.guess_type(documento.archivo.name)
        filename = documento.archivo.name.split('/')[-1]
        response = FileResponse(
            documento.archivo.open('rb'),
            content_type=content_type or 'application/octet-stream',
        )
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response.xframe_options_exempt = True
        return response


class ClienteRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .client_portal import PortalUserConflictError, ensure_portal_user_for_cliente

        serializer = ClienteRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email = data['email'].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            return Response({'email': ['Este correo ya está registrado.']}, status=status.HTTP_400_BAD_REQUEST)

        cliente = Cliente.objects.filter(email__iexact=email).first()
        try:
            if cliente:
                user, _created = ensure_portal_user_for_cliente(cliente, data['password'])
            else:
                username = data['username']
                if User.objects.filter(username=username).exists():
                    return Response({'username': ['Este usuario ya existe.']}, status=status.HTTP_400_BAD_REQUEST)
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=data['password'],
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                )
                profile = user.profile
                profile.role = 'CLIENTE'
                profile.save(update_fields=['role'])
        except PortalUserConflictError as exc:
            return Response({exc.field: [exc.message]}, status=status.HTTP_400_BAD_REQUEST)

        profile = user.profile
        if cliente and not profile.cliente_id:
            profile.cliente = cliente
            profile.save(update_fields=['cliente'])

        return Response(
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'cliente_id': profile.cliente_id,
            },
            status=status.HTTP_201_CREATED,
        )
