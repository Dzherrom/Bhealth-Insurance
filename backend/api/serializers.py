from django.contrib.auth.models import User, Group
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, PolizaCliente, Licencia, Nota, HistorialPoliza,
    NotaAdjunto,
    Etiqueta, Documento, Tarea, UserProfile,
    InfoPago, TarjetaCredito, CuentaBancaria, PolizaViewer, Cita, Medico, Medicamento, Recordatorio,
    Contrato, ReporteComision, ConfiguracionComision, Notificacion, PolizaTransferencia, MatrizPermisoRol, AuditoriaGlobal, ConfiguracionNotificacion
)


def normalize_role(role):
    return (role or '').strip().upper()

def can_view_sensitive_data(request_user):
    if not request_user or not request_user.is_authenticated:
        return False
    if request_user.is_superuser:
        return True
    try:
        if hasattr(request_user, 'profile'):
            return normalize_role(request_user.profile.role) in ['ADMIN', 'MANAGER', 'SHERPA']
    except Exception:
        pass
    return False

def get_request_user_role(serializer_instance):
    request = serializer_instance.context.get('request') if hasattr(serializer_instance, 'context') else None
    if not request or not hasattr(request, 'user'):
        return None
    user = request.user
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'ADMIN'
    if hasattr(user, 'profile'):
        return user.profile.role
    return None

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ProfileDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('role', 'status', 'avatar', 'telefono', 'agente')

class UserManagementSerializer(serializers.ModelSerializer):
    profile = ProfileDataSerializer()
    groups = serializers.SlugRelatedField(many=True, slug_field='name', queryset=Group.objects.all())

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'groups', 'profile', 'is_active', 'date_joined', 'last_login')
        read_only_fields = ('date_joined', 'last_login')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        groups_data = validated_data.pop('groups', None)

        instance = super().update(instance, validated_data)

        if groups_data is not None:
            instance.groups.set(groups_data)

        profile = instance.profile
        for attr, value in profile_data.items():
            setattr(profile, attr, value)
        profile.save()

        return instance

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class DireccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direccion
        fields = '__all__'

class AgenciaSerializer(serializers.ModelSerializer):
    direccion_negocio_details = DireccionSerializer(source='direccion_negocio', read_only=True)
    # Allow creating/updating address via ID
    direccion_negocio = serializers.PrimaryKeyRelatedField(
        queryset=Direccion.objects.all(), 
        required=False, 
        allow_null=True
    )

    class Meta:
        model = Agencia
        fields = '__all__'

class AgenteSerializer(serializers.ModelSerializer):
    agencia_nombre = serializers.ReadOnlyField(source='agencia.nombre')
    
    class Meta:
        model = Agente
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    marketplace_password = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    portal_password = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    direccion_fisica = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_postal = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_facturacion = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_fisica_details = DireccionSerializer(source='direccion_fisica', read_only=True)
    direccion_postal_details = DireccionSerializer(source='direccion_postal', read_only=True)
    direccion_facturacion_details = DireccionSerializer(source='direccion_facturacion', read_only=True)

    class Meta:
        model = Cliente
        fields = '__all__'

    def validate(self, attrs):
        if self.instance is None:
            required_on_create = ('direccion_fisica', 'direccion_postal', 'direccion_facturacion')
            errors = {}
            for field in required_on_create:
                if attrs.get(field) is None:
                    errors[field] = 'Este campo es obligatorio al crear un cliente.'
            if errors:
                raise serializers.ValidationError(errors)
        return attrs

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        
        if 'marketplace_password' in data and data['marketplace_password']:
            data['marketplace_password'] = encrypt_text(data['marketplace_password'])
            
        if 'portal_password' in data and data['portal_password']:
            data['portal_password'] = encrypt_text(data['portal_password'])
            
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        request = self.context.get('request')
        user = request.user if request else None
        
        can_view_full = can_view_sensitive_data(user)
        
        if not can_view_full and instance.ssn:
            if len(instance.ssn) > 4:
                ret['ssn'] = "***-**-" + instance.ssn[-4:]
            else:
                ret['ssn'] = "***-**-****"
                
        if instance.marketplace_password:
            try:
                ret['marketplace_password'] = decrypt_text(instance.marketplace_password)
            except:
                ret['marketplace_password'] = None
                
        if instance.portal_password:
            try:
                ret['portal_password'] = decrypt_text(instance.portal_password)
            except:
                ret['portal_password'] = None
                
        return ret

class AseguradoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aseguradora
        fields = '__all__'

class PlanSerializer(serializers.ModelSerializer):
    aseguradora_nombre = serializers.ReadOnlyField(source='aseguradora.nombre')

    class Meta:
        model = Plan
        fields = '__all__'

class EstadoPolizaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoPoliza
        fields = '__all__'

class InfoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfoPago
        fields = '__all__'

from .encryption import encrypt_text, decrypt_text

class TarjetaCreditoSerializer(serializers.ModelSerializer):
    numero = serializers.CharField(max_length=500)
    cvv = serializers.CharField(max_length=100)

    class Meta:
        model = TarjetaCredito
        fields = '__all__'

    def to_internal_value(self, data):
        # Encrypt before validating/saving
        # We need to copy data because QueryDict might be immutable
        if hasattr(data, 'copy'):
            data = data.copy()
        
        # We assume input is raw. If it is already encrypted? We assume API receives raw.
        if 'numero' in data and data['numero']:
            data['numero'] = encrypt_text(data['numero'])
        
        if 'cvv' in data and data['cvv']:
            data['cvv'] = encrypt_text(data['cvv'])
            
        return super().to_internal_value(data)

    def to_representation(self, instance):
        # Start with default representation
        ret = super().to_representation(instance)
        
        request = self.context.get('request')
        user = request.user if request else None
        
        can_view_full = can_view_sensitive_data(user)

        if can_view_full:
            ret['numero'] = decrypt_text(instance.numero)
            ret['cvv'] = decrypt_text(instance.cvv)
        else:
            # Mask data
            decrypted_num = decrypt_text(instance.numero)
            ret['numero'] = self._mask_number(decrypted_num) if decrypted_num else None
            ret['cvv'] = "***"
            
        return ret

    def _mask_number(self, full_number):
        if not full_number:
            return ""
        if len(full_number) > 4:
            return "*" * (len(full_number) - 4) + full_number[-4:]
        return full_number

class CuentaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaBancaria
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None

        if not can_view_sensitive_data(user):
            # Mask data
            if instance.numero_cuenta and len(instance.numero_cuenta) > 4:
                ret['numero_cuenta'] = "***" + instance.numero_cuenta[-4:]
            else:
                ret['numero_cuenta'] = "***"
                
            if instance.aba_routing and len(instance.aba_routing) > 4:
                ret['aba_routing'] = "***" + instance.aba_routing[-4:]
            else:
                ret['aba_routing'] = "***"

        return ret

class EtiquetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etiqueta
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    subido_por_username = serializers.ReadOnlyField(source='subido_por.username')
    cliente_nombre = serializers.ReadOnlyField(source='cliente.__str__')
    etiquetas_details = EtiquetaSerializer(source='etiquetas', many=True, read_only=True)
    etiquetas_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Etiqueta.objects.all(), source='etiquetas'
    )

    class Meta:
        model = Documento
        fields = '__all__'
        read_only_fields = ('subido_por', 'fecha_subida')

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None

        if not can_view_sensitive_data(user):
            # No-descargables para ASISTENTES y otros roles no permitidos.
            # Remplazamos la URL del archivo con el nombre o nulo, para que no puedan abrir/descargar el archivo.
            ret['archivo'] = None
            ret['descarga_bloqueada'] = True
        else:
            ret['descarga_bloqueada'] = False

        return ret

class NotaSerializer(serializers.ModelSerializer):
    autor_username = serializers.ReadOnlyField(source='autor.username')
    usuarios_etiquetados_names = serializers.SlugRelatedField(
        many=True, 
        read_only=True, 
        slug_field='username', 
        source='usuarios_etiquetados'
    )
    adjuntos = serializers.SerializerMethodField()

    class Meta:
        model = Nota
        fields = '__all__'
        read_only_fields = ('autor', 'fecha_creacion', 'usuarios_etiquetados')

    def get_adjuntos(self, obj):
        return [
            {
                'id': adjunto.id,
                'archivo': adjunto.archivo.url if adjunto.archivo else None,
                'nombre': adjunto.archivo.name.split('/')[-1] if adjunto.archivo else None,
            }
            for adjunto in obj.adjuntos.all()
        ]

    def create(self, validated_data):
        nota = Nota.objects.create(**validated_data)
        request = self.context.get('request')

        if request and hasattr(request, 'FILES'):
            for archivo in request.FILES.getlist('archivos'):
                NotaAdjunto.objects.create(nota=nota, archivo=archivo)

        return nota

class PolizaClienteSerializer(serializers.ModelSerializer):
    cliente_details = ClienteSerializer(source='cliente', read_only=True)
    direccion_residencia_details = DireccionSerializer(source='direccion_residencia', read_only=True)
    direccion_postal_details = DireccionSerializer(source='direccion_postal', read_only=True)
    
    # For writing, we accept IDs
    cliente = serializers.PrimaryKeyRelatedField(queryset=Cliente.objects.all())
    direccion_residencia = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_postal = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PolizaCliente
        fields = [
            'id', 'cliente', 'cliente_details', 'es_solicitante_principal', 'relacion',
            'direccion_residencia', 'direccion_residencia_details',
            'direccion_postal', 'direccion_postal_details'
        ]

class MedicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medico
        fields = '__all__'

class MedicamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicamento
        fields = '__all__'

class CitaSerializer(serializers.ModelSerializer):
    creado_por_username = serializers.ReadOnlyField(source='creado_por.username')
    cliente_nombre = serializers.SerializerMethodField()
    poliza_codigo = serializers.ReadOnlyField(source='poliza.id_mercado')
    medico_asignado_details = MedicoSerializer(source='medico_asignado', read_only=True)
    
    class Meta:
        model = Cita
        fields = '__all__'
        read_only_fields = ('creado_por', 'fecha_creacion')

    def get_cliente_nombre(self, obj):
        return str(obj.cliente) if obj.cliente else None

class HistorialPolizaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.ReadOnlyField(source='usuario.username')
    
    class Meta:
        model = HistorialPoliza
        fields = '__all__'

class PolizaTransferenciaSerializer(serializers.ModelSerializer):
    de_usuario_username = serializers.ReadOnlyField(source='de_usuario.username')
    a_usuario_username = serializers.ReadOnlyField(source='a_usuario.username')
    request_user_role = serializers.SerializerMethodField()

    class Meta:
        model = PolizaTransferencia
        fields = '__all__'

    def get_request_user_role(self, obj):
        return get_request_user_role(self)

class MatrizPermisoRolSerializer(serializers.ModelSerializer):
    actualizado_por_username = serializers.ReadOnlyField(source='actualizado_por.username')

    class Meta:
        model = MatrizPermisoRol
        fields = '__all__'
        read_only_fields = ('actualizado_por', 'fecha_actualizacion')

class AuditoriaGlobalSerializer(serializers.ModelSerializer):
    usuario_username = serializers.ReadOnlyField(source='usuario.username')

    class Meta:
        model = AuditoriaGlobal
        fields = '__all__'

class RecordatorioSerializer(serializers.ModelSerializer):
    usuario_notificar_username = serializers.ReadOnlyField(source='usuario_notificar.username')

    class Meta:
        model = Recordatorio
        fields = '__all__'


class PolizaListSerializer(serializers.ModelSerializer):
    agente_nombre = serializers.ReadOnlyField(source='agente.nombre_completo')
    plan_nombre = serializers.ReadOnlyField(source='plan.nombre')
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre')
    cliente_principal = serializers.SerializerMethodField()

    class Meta:
        model = Poliza
        fields = [
            'id',
            'id_mercado',
            'id_miembro',
            'id_interno',
            'agente',
            'agente_nombre',
            'plan',
            'plan_nombre',
            'estado',
            'estado_nombre',
            'prima_mensual',
            'costo_poliza',
            'subsidio',
            'fecha_efectiva',
            'fecha_envio',
            'total_miembros',
            'total_aplicantes',
            'total_dependientes',
            'cliente_principal',
            'ultima_actualizacion',
        ]

    def get_cliente_principal(self, obj):
        principal_link = next(
            (pc for pc in obj.polizacliente_set.all() if pc.es_solicitante_principal and pc.cliente_id),
            None,
        )
        if not principal_link:
            return None

        cliente = principal_link.cliente
        nombre = (cliente.primer_nombre or '').strip()
        apellido = (cliente.apellido_paterno or '').strip()
        full_name = f"{nombre} {apellido}".strip()
        return full_name or str(cliente)

class PolizaSerializer(serializers.ModelSerializer):
    clientes_info = PolizaClienteSerializer(source='polizacliente_set', many=True, read_only=True)
    # To allow creating relationships on create/update
    clientes_data = PolizaClienteSerializer(many=True, write_only=True, required=False)
    
    agente_nombre = serializers.ReadOnlyField(source='agente.nombre_completo')
    plan_nombre = serializers.ReadOnlyField(source='plan.nombre')
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre')
    colaboradores_details = UserSerializer(source='colaboradores', many=True, read_only=True)
    active_viewers = serializers.SerializerMethodField()

    # Address Details (fallback to main client addresses when policy addresses are empty)
    direccion_fisica_details = serializers.SerializerMethodField()
    direccion_postal_details = serializers.SerializerMethodField()
    direccion_facturacion_details = serializers.SerializerMethodField()

    # Payment Info
    info_pago = InfoPagoSerializer(read_only=True)
    tarjetas_credito = TarjetaCreditoSerializer(many=True, read_only=True)
    cuentas_bancarias = CuentaBancariaSerializer(many=True, read_only=True)
    
    # Extras
    otras_polizas = serializers.SerializerMethodField()
    notas = NotaSerializer(many=True, read_only=True)
    documentos = DocumentoSerializer(many=True, read_only=True)
    citas = CitaSerializer(many=True, read_only=True)
    medicamentos = MedicamentoSerializer(many=True, read_only=True)
    historial = HistorialPolizaSerializer(many=True, read_only=True)
    recordatorios = RecordatorioSerializer(many=True, read_only=True)
    transferencias = PolizaTransferenciaSerializer(many=True, read_only=True)
    request_user_role = serializers.SerializerMethodField()
    fecha_efectiva = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Poliza
        fields = [
            'id', 'id_mercado', 'id_miembro', 'costo_poliza', 'subsidio', 'prima_mensual',
            'total_ahorros', 'plan_era',
            'fecha_efectiva', 'estado', 'estado_nombre', 'flujo_etapa', 'fecha_envio', 'fecha_cancelacion',
            'id_interno', 'agente', 'agente_nombre', 'plan', 'plan_nombre',
            'clientes_info', 'clientes_data', 'colaboradores', 'colaboradores_details',
            'ffm_mercado', 'npn_mercado', 'tipo_inscripcion', 'razon_inscripcion_especial', 'fecha_inscripcion_especial',
            'total_miembros', 'total_aplicantes', 'total_dependientes',
            'direccion_fisica', 'direccion_fisica_details',
            'direccion_postal', 'direccion_postal_details',
            'direccion_facturacion', 'direccion_facturacion_details',
            'info_pago', 'tarjetas_credito', 'cuentas_bancarias', 
            'otras_polizas', 'notas', 'documentos', 'citas', 'medicamentos', 'historial', 'recordatorios', 'transferencias',
            'request_user_role',
            'active_viewers',
            'ultima_actualizacion', 'es_duplicado', 'ultimo_duplicado'
        ]

    def get_request_user_role(self, obj):
        return get_request_user_role(self)

    def _get_main_cliente(self, obj):
        principal = obj.polizacliente_set.filter(es_solicitante_principal=True).select_related(
            'cliente__direccion_fisica',
            'cliente__direccion_postal',
            'cliente__direccion_facturacion',
        ).first()
        return principal.cliente if principal and principal.cliente_id else None

    def get_direccion_fisica_details(self, obj):
        direccion = obj.direccion_fisica
        if direccion is None:
            cliente = self._get_main_cliente(obj)
            direccion = cliente.direccion_fisica if cliente else None
        return DireccionSerializer(direccion).data if direccion else None

    def get_direccion_postal_details(self, obj):
        direccion = obj.direccion_postal
        if direccion is None:
            cliente = self._get_main_cliente(obj)
            direccion = cliente.direccion_postal if cliente else None
        return DireccionSerializer(direccion).data if direccion else None

    def get_direccion_facturacion_details(self, obj):
        direccion = obj.direccion_facturacion
        if direccion is None:
            cliente = self._get_main_cliente(obj)
            direccion = cliente.direccion_facturacion if cliente else None
        return DireccionSerializer(direccion).data if direccion else None

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Keep compatibility with UIs that still read direccion_* IDs directly from policy.
        if data.get('direccion_fisica') is None:
            details = data.get('direccion_fisica_details') or {}
            if details.get('id'):
                data['direccion_fisica'] = details['id']

        if data.get('direccion_postal') is None:
            details = data.get('direccion_postal_details') or {}
            if details.get('id'):
                data['direccion_postal'] = details['id']

        if data.get('direccion_facturacion') is None:
            details = data.get('direccion_facturacion_details') or {}
            if details.get('id'):
                data['direccion_facturacion'] = details['id']

        return data

    def get_active_viewers(self, obj):
        from django.utils import timezone
        import datetime
        threshold = timezone.now() - datetime.timedelta(seconds=60)
        viewers = obj.viewers.filter(last_seen__gte=threshold)
        return [v.usuario.username for v in viewers]

    def get_otras_polizas(self, obj):
        main_applicant_link = obj.polizacliente_set.filter(es_solicitante_principal=True).first()
        if main_applicant_link:
            other_policies = Poliza.objects.filter(clientes=main_applicant_link.cliente).exclude(id=obj.id).distinct()
            return [
                {
                    "id": p.id,
                    "id_mercado": p.id_mercado,
                    "estado": p.estado.nombre if p.estado else None,
                    "agente": p.agente.nombre_completo if p.agente else None,
                    "cliente": str(main_applicant_link.cliente),
                    "asignado": [u.username for u in p.colaboradores.all()]
                } for p in other_policies
            ]
        return []

    def create(self, validated_data):
        clientes_data = validated_data.pop('clientes_data', [])
        colaboradores = validated_data.pop('colaboradores', [])
        poliza = Poliza.objects.create(**validated_data)
        
        if colaboradores:
            poliza.colaboradores.set(colaboradores)

        for client_data in clientes_data:
            PolizaCliente.objects.create(poliza=poliza, **client_data)
            
        return poliza

    def update(self, instance, validated_data):
        clientes_data = validated_data.pop('clientes_data', None)
        colaboradores = validated_data.pop('colaboradores', None)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if colaboradores is not None:
            instance.colaboradores.set(colaboradores)
        
        # Update relationships if provided
        if clientes_data is not None:
            # For simplicity, we might clear existing and re-add, or try to match.
            # A simple approach for now: remove all and re-add
            instance.polizacliente_set.all().delete()
            for client_data in clientes_data:
                PolizaCliente.objects.create(poliza=instance, **client_data)
                
        return instance

class TareaSerializer(serializers.ModelSerializer):
    asignado_a_username = serializers.ReadOnlyField(source='asignado_a.username')
    creado_por_username = serializers.ReadOnlyField(source='creado_por.username')
    poliza_id_mercado = serializers.ReadOnlyField(source='poliza.id_mercado')

    class Meta:
        model = Tarea
        fields = '__all__'
        read_only_fields = ('creado_por', 'fecha_creacion')

class ContratoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contrato
        fields = '__all__'

class ReporteComisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteComision
        fields = '__all__'

class ConfiguracionComisionSerializer(serializers.ModelSerializer):
    agencia_nombre = serializers.ReadOnlyField(source='agencia.nombre')
    aseguradora_nombre = serializers.ReadOnlyField(source='aseguradora.nombre')
    plan_nombre = serializers.ReadOnlyField(source='plan.nombre')

    class Meta:
        model = ConfiguracionComision
        fields = '__all__'

class ZipCodeSerializer(serializers.Serializer):
    zip_code = serializers.CharField(max_length=20)
    country_code = serializers.CharField(max_length=2, required=False, default='us')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @staticmethod
    def _resolve_user_role(user):
        # Superuser must always map to ADMIN for CRM access in frontend.
        if user.is_superuser:
            return 'ADMIN'
        if hasattr(user, 'profile') and getattr(user.profile, 'role', None):
            return normalize_role(user.profile.role)
        return 'USER'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Añadir custom claims al token en si mismo
        token['role'] = cls._resolve_user_role(user)
        token['username'] = user.username
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs) 
        
        data['role'] = self._resolve_user_role(self.user)
        data['username'] = self.user.username
        data['id'] = self.user.id
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        
        return data



class ConfiguracionNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionNotificacion
        fields = '__all__'






