from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .client_portal import (
    CLIENT_EDITABLE_FIELDS,
    format_direccion,
    get_primary_poliza_for_cliente,
    is_cliente_user,
    map_campo_to_tipo,
    resolve_cliente_for_user,
    user_owns_poliza,
)
from .models import CambioDeVida, Poliza
from .permissions import IsClienteRole


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
        return value

    def validate_poliza_id(self, value):
        request = self.context['request']
        try:
            poliza = Poliza.objects.select_related('agente').get(pk=value)
        except Poliza.DoesNotExist as exc:
            raise serializers.ValidationError('Póliza no encontrada.') from exc

        if not user_owns_poliza(request.user, poliza):
            raise serializers.ValidationError('No tiene permiso para solicitar cambios en esta póliza.')

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
        cliente = resolve_cliente_for_user(request.user)
        if not cliente:
            return Response(
                {'detail': 'No se encontró un perfil de cliente vinculado a esta cuenta.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        poliza = get_primary_poliza_for_cliente(cliente)
        if not poliza:
            return Response(
                {
                    'cliente_id': cliente.id,
                    'nombre_completo': f'{cliente.primer_nombre} {cliente.apellido_paterno}'.strip(),
                    'poliza': None,
                    'mensaje': 'No tiene pólizas registradas.',
                }
            )

        direccion = poliza.direccion_fisica or cliente.direccion_fisica
        grupo_familiar = []
        for link in poliza.polizacliente_set.all():
            member = link.cliente
            grupo_familiar.append({
                'nombre': f'{member.primer_nombre} {member.apellido_paterno}'.strip(),
                'relacion': link.relacion,
                'es_solicitante_principal': link.es_solicitante_principal,
            })

        tarjetas = [
            {
                'id': tarjeta.id,
                'tipo_tarjeta': tarjeta.tipo_tarjeta,
                'numero_enmascarado': self._mask_card(tarjeta.numero),
                'nombre_titular': tarjeta.nombre_titular,
                'fecha_vencimiento': tarjeta.fecha_vencimiento,
            }
            for tarjeta in poliza.tarjetas_credito.all()
        ]

        agente = poliza.agente
        return Response({
            'cliente_id': cliente.id,
            'nombre_completo': f'{cliente.primer_nombre} {cliente.apellido_paterno}'.strip(),
            'fecha_nacimiento': cliente.fecha_nacimiento.isoformat() if cliente.fecha_nacimiento else None,
            'direccion_completa': format_direccion(direccion),
            'telefono': cliente.telefono,
            'email': cliente.email,
            'ingresos': str(cliente.ingreso_anual),
            'grupo_familiar': grupo_familiar,
            'tarjetas_digitales': tarjetas,
            'elegibilidad': self._build_elegibilidad(cliente, poliza),
            'agente': {
                'nombre': agente.nombre_completo if agente else None,
                'npn': agente.npn if agente else None,
            },
            'poliza': {
                'id': poliza.id,
                'estatus': poliza.estado.nombre if poliza.estado_id else None,
                'plan': poliza.nombre_plan or (poliza.plan.nombre if poliza.plan_id else None),
                'prima_mensual': str(poliza.prima_mensual),
                'costo_poliza': str(poliza.costo_poliza),
                'subsidio': str(poliza.subsidio),
                'fecha_efectiva': poliza.fecha_efectiva.isoformat() if poliza.fecha_efectiva else None,
                'id_mercado': poliza.id_mercado,
            },
            'campos_editables': sorted(CLIENT_EDITABLE_FIELDS),
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


class ClienteRegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.models import User

        from .models import Cliente, UserProfile

        serializer = ClienteRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if User.objects.filter(username=data['username']).exists():
            return Response({'username': ['Este usuario ya existe.']}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=data['email']).exists():
            return Response({'email': ['Este correo ya está registrado.']}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
        )

        profile = user.profile
        profile.role = 'CLIENTE'
        cliente = Cliente.objects.filter(email__iexact=data['email']).first()
        if cliente:
            profile.cliente = cliente
        profile.save()

        return Response(
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'cliente_id': profile.cliente_id,
            },
            status=status.HTTP_201_CREATED,
        )
