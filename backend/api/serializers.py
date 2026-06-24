from django.contrib.auth.models import User, Group
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, PolizaCliente, Licencia, Nota, HistorialPoliza,
    NotaAdjunto,
    Etiqueta, Documento, Tarea, CambioDeVida, UserProfile, TipoProducto,
    InfoPago, TarjetaCredito, CuentaBancaria, PolizaViewer, Cita, Medico, Medicamento, MedicoPoliza, Recordatorio,
    Contrato, ReporteComision, ConfiguracionComision, Notificacion, PolizaTransferencia, MatrizPermisoRol, AuditoriaGlobal, ConfiguracionNotificacion
)


class FlatFileUploadSerializer(serializers.Serializer):
    archivo = serializers.FileField(required=False)
    file = serializers.FileField(required=False)

    def validate(self, attrs):
        if not attrs.get('archivo') and not attrs.get('file'):
            raise serializers.ValidationError("Debe adjuntar un archivo en 'archivo' o 'file'.")
        return attrs


def normalize_role(role):
    return (role or '').strip().upper()

AGENT_ROLES = {'ADMIN', 'MANAGER', 'ASISTENTE', 'SHERPA', 'PAGOS', 'CITAS'}


def sync_profile_agente_credentials(profile):
    """Keep linked Agente NPN in sync with profile.npn for agent-capable roles."""
    if normalize_role(profile.role) not in AGENT_ROLES:
        return
    npn = (profile.npn or '').strip()
    if not npn:
        return

    from .models import Agencia, Agente

    if profile.agente_id:
        agente = profile.agente
        if agente.npn != npn:
            agente.npn = npn
            agente.save(update_fields=['npn'])
        return

    agencia = Agencia.objects.first()
    if not agencia:
        return

    user = profile.user
    nombre = f'{user.first_name} {user.last_name}'.strip() or user.username
    agente = Agente.objects.create(
        npn=npn,
        ffm=f'FFM-{npn}',
        nombre_completo=nombre,
        agencia=agencia,
    )
    profile.agente = agente
    profile.save(update_fields=['agente'])


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
    agente_npn = serializers.SerializerMethodField()
    agente_ffm = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('role', 'status', 'avatar', 'telefono', 'npn', 'ssn', 'cliente', 'agente', 'agente_npn', 'agente_ffm', 'settings')

    def get_agente_npn(self, obj):
        if obj.npn:
            return obj.npn
        return obj.agente.npn if obj.agente_id else None

    def get_agente_ffm(self, obj):
        return obj.agente.ffm if obj.agente_id else None

    def validate_npn(self, value):
        if not value:
            return value
        npn = value.strip()
        qs = UserProfile.objects.filter(npn=npn)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Este NPN ya está asignado a otro empleado.')
        agente_qs = Agente.objects.filter(npn=npn)
        if self.instance and self.instance.agente_id:
            agente_qs = agente_qs.exclude(pk=self.instance.agente_id)
        if agente_qs.exists():
            raise serializers.ValidationError('Este NPN ya está registrado en otro agente.')
        return npn

    def validate_ssn(self, value):
        if not value:
            return value
        ssn = value.strip()
        qs = UserProfile.objects.filter(ssn=ssn)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Este SSN ya está asignado a otro empleado.')
        return ssn

    def update(self, instance, validated_data):
        profile = super().update(instance, validated_data)
        sync_profile_agente_credentials(profile)
        return profile

class UserManagementSerializer(serializers.ModelSerializer):
    profile = ProfileDataSerializer()
    groups = serializers.SlugRelatedField(many=True, slug_field='name', queryset=Group.objects.all())

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'groups', 'profile', 'is_active', 'date_joined', 'last_login')
        read_only_fields = ('date_joined', 'last_login')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        groups_data = validated_data.pop('groups', None)

        instance = super().update(instance, validated_data)

        if groups_data is not None:
            instance.groups.set(groups_data)

        if profile_data is not None:
            profile_serializer = ProfileDataSerializer(
                instance.profile,
                data=profile_data,
                partial=True,
            )
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

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
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True, format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])
    marketplace_password = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    portal_password = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password_portal = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    portal_usuario_id = serializers.SerializerMethodField()
    portal_cuenta_creada = serializers.SerializerMethodField()
    direccion_fisica = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_postal = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_facturacion = serializers.PrimaryKeyRelatedField(queryset=Direccion.objects.all(), required=False, allow_null=True)
    direccion_fisica_details = DireccionSerializer(source='direccion_fisica', read_only=True)
    direccion_postal_details = DireccionSerializer(source='direccion_postal', read_only=True)
    direccion_facturacion_details = DireccionSerializer(source='direccion_facturacion', read_only=True)
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = '__all__'

    def get_nombre_completo(self, obj):
        parts = [obj.primer_nombre, obj.segundo_nombre, obj.apellido_paterno, obj.apellido_materno]
        return ' '.join(part for part in parts if part).strip()

    def get_portal_usuario_id(self, obj):
        if hasattr(obj, '_portal_usuario_id'):
            return obj._portal_usuario_id
        from .client_portal import get_portal_user_for_cliente
        user = get_portal_user_for_cliente(obj)
        return user.id if user else None

    def get_portal_cuenta_creada(self, obj):
        return getattr(obj, '_portal_cuenta_creada', False)

    def validate(self, attrs):
        email = attrs.get('email')
        if email is None and self.instance is not None:
            email = self.instance.email
        if email:
            email = email.strip().lower()
            attrs['email'] = email
            qs = Cliente.objects.filter(email__iexact=email)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'email': 'Ya existe un cliente registrado con este correo electrónico.',
                })

        ssn = attrs.get('ssn')
        if ssn is None and self.instance is not None:
            ssn = self.instance.ssn
        if ssn:
            ssn = ssn.strip()
            attrs['ssn'] = ssn
            qs = Cliente.objects.filter(ssn=ssn)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'ssn': 'Ya existe un cliente registrado con este SSN.',
                })

        password_portal = attrs.get('password_portal')
        if password_portal == '':
            attrs.pop('password_portal', None)
        elif password_portal and not (attrs.get('email') or (self.instance and self.instance.email)):
            raise serializers.ValidationError({
                'email': 'El correo es obligatorio para crear la cuenta del portal.',
            })

        return attrs

    def create(self, validated_data):
        from .client_portal import PortalUserConflictError, ensure_portal_user_for_cliente

        password_portal = validated_data.pop('password_portal', None)
        instance = super().create(validated_data)

        if password_portal:
            try:
                user, created = ensure_portal_user_for_cliente(instance, password_portal)
            except PortalUserConflictError as exc:
                raise serializers.ValidationError({exc.field: exc.message}) from exc
            instance._portal_usuario_id = user.id
            instance._portal_cuenta_creada = created

        return instance

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
    fecha_primer_pago = serializers.DateField(
        required=False,
        allow_null=True,
        input_formats=['%Y-%m-%d', '%m/%d/%Y'],
    )

    class Meta:
        model = InfoPago
        fields = '__all__'

    def create(self, validated_data):
        validated_data.setdefault('estado_pago', InfoPago.ESTADO_PENDIENTE)
        return super().create(validated_data)

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
    cliente_nombre = serializers.SerializerMethodField()
    etiquetas_details = EtiquetaSerializer(source='etiquetas', many=True, read_only=True)
    etiquetas_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Etiqueta.objects.all(), source='etiquetas', required=False
    )

    class Meta:
        model = Documento
        fields = '__all__'
        read_only_fields = ('subido_por', 'fecha_subida')

    def get_cliente_nombre(self, obj):
        return str(obj.cliente) if obj.cliente_id else None

    def create(self, validated_data):
        validated_data.setdefault('estado_documento', Documento.ESTADO_DOCUMENTO_CHOICES[0][0])
        return super().create(validated_data)

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
    autor_nombre_completo = serializers.SerializerMethodField()
    autor_avatar = serializers.SerializerMethodField()
    autor_rol = serializers.SerializerMethodField()
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

    def get_autor_nombre_completo(self, obj):
        if not obj.autor_id:
            return 'Usuario'
        autor = obj.autor
        nombre = f"{autor.first_name or ''} {autor.last_name or ''}".strip()
        return nombre or autor.username

    def get_autor_avatar(self, obj):
        try:
            avatar = obj.autor.profile.avatar
            return avatar.url if avatar else None
        except Exception:
            return None

    def get_autor_rol(self, obj):
        try:
            return obj.autor.profile.get_role_display()
        except Exception:
            return None

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

class MedicoPolizaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicoPoliza
        fields = ['id', 'poliza', 'nombre', 'especializacion', 'hospital', 'fecha_creacion']
        read_only_fields = ('fecha_creacion',)

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

    def validate(self, attrs):
        poliza = attrs.get('poliza') or (self.instance.poliza if self.instance else None)
        cliente = attrs.get('cliente')
        if cliente is None and self.instance:
            cliente = self.instance.cliente
        if poliza and cliente and not poliza.clientes.filter(pk=cliente.pk).exists():
            raise serializers.ValidationError({
                'cliente': 'El paciente seleccionado no pertenece a esta póliza.',
            })
        return attrs

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
    agente_registro_nombre = serializers.ReadOnlyField(source='agente_registro.nombre_completo')
    agente_npn = serializers.SerializerMethodField()
    asistente_nombre = serializers.SerializerMethodField()
    asistente_npn = serializers.SerializerMethodField()
    plan_nombre = serializers.ReadOnlyField(source='plan.nombre')
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre')
    estado_documento_display = serializers.SerializerMethodField()
    estado_pago = serializers.SerializerMethodField()
    estado_pago_display = serializers.SerializerMethodField()
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
            'agente_registro',
            'agente_registro_nombre',
            'agente_npn',
            'asistente_nombre',
            'asistente_npn',
            'plan',
            'plan_nombre',
            'tipo_producto',
            'estado',
            'estado_nombre',
            'estado_documento',
            'estado_documento_display',
            'estado_pago',
            'estado_pago_display',
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

    def get_estado_documento_display(self, obj):
        return dict(Poliza.ESTADO_DOCUMENTO_POLIZA_CHOICES).get(
            obj.estado_documento,
            obj.estado_documento or 'Pendiente',
        )

    def get_estado_pago(self, obj):
        info_pago = getattr(obj, 'info_pago', None)
        if info_pago:
            return info_pago.estado_pago
        return InfoPago.ESTADO_PENDIENTE

    def get_estado_pago_display(self, obj):
        return dict(InfoPago.ESTADO_CHOICES).get(self.get_estado_pago(obj), 'Pendiente')

    def _resolve_npn(self, profile):
        if not profile:
            return None
        if profile.npn:
            return profile.npn
        if profile.agente_id:
            return profile.agente.npn
        return None

    def get_agente_npn(self, obj):
        if obj.agente_id:
            return obj.agente.npn
        return None

    def _get_asistente_colaborador(self, obj):
        colaboradores = getattr(obj, '_prefetched_objects_cache', {}).get('colaboradores')
        if colaboradores is None:
            colaboradores = obj.colaboradores.select_related('profile__agente').all()
        for user in colaboradores:
            profile = getattr(user, 'profile', None)
            if profile and normalize_role(profile.role) == 'ASISTENTE':
                return user
        colaboradores_list = list(colaboradores)
        return colaboradores_list[0] if colaboradores_list else None

    def get_asistente_nombre(self, obj):
        user = self._get_asistente_colaborador(obj)
        if not user:
            return None
        nombre = f'{user.first_name} {user.last_name}'.strip()
        return nombre or user.username

    def get_asistente_npn(self, obj):
        user = self._get_asistente_colaborador(obj)
        if not user:
            return None
        profile = getattr(user, 'profile', None)
        return self._resolve_npn(profile)

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
    agente_registro_nombre = serializers.ReadOnlyField(source='agente_registro.nombre_completo')
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all(), required=False, allow_null=True)
    plan_nombre = serializers.SerializerMethodField()
    aseguradora_nombre = serializers.SerializerMethodField()
    tipo_producto_nombre = serializers.ReadOnlyField(source='tipo_producto.nombre')
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre')
    colaboradores_details = UserSerializer(source='colaboradores', many=True, read_only=True)
    active_viewers = serializers.SerializerMethodField()

    # Address Details (fallback to main client addresses when policy addresses are empty)
    direccion_fisica_details = serializers.SerializerMethodField()
    direccion_postal_details = serializers.SerializerMethodField()
    direccion_facturacion_details = serializers.SerializerMethodField()

    # Payment Info
    info_pago = InfoPagoSerializer(read_only=True, allow_null=True)
    tarjetas_credito = TarjetaCreditoSerializer(many=True, read_only=True)
    cuentas_bancarias = CuentaBancariaSerializer(many=True, read_only=True)
    
    # Extras
    otras_polizas = serializers.SerializerMethodField()
    notas = NotaSerializer(many=True, read_only=True)
    etiquetas = EtiquetaSerializer(many=True, read_only=True)
    etiquetas_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Etiqueta.objects.all(), source='etiquetas', required=False
    )
    documentos = DocumentoSerializer(many=True, read_only=True)
    citas = CitaSerializer(many=True, read_only=True)
    medicamentos = MedicamentoSerializer(many=True, read_only=True)
    medicos_principales = MedicoPolizaSerializer(many=True, read_only=True)
    historial = HistorialPolizaSerializer(many=True, read_only=True)
    recordatorios = RecordatorioSerializer(many=True, read_only=True)
    transferencias = PolizaTransferenciaSerializer(many=True, read_only=True)
    request_user_role = serializers.SerializerMethodField()
    fecha_efectiva = serializers.DateField(required=False, allow_null=True, format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])
    fecha_cancelacion = serializers.DateField(required=False, allow_null=True, format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])
    fecha_inscripcion_especial = serializers.DateField(required=False, allow_null=True, format='%m/%d/%Y', input_formats=['%m/%d/%Y', '%Y-%m-%d'])

    class Meta:
        model = Poliza
        fields = [
            'id', 'id_mercado', 'id_miembro', 'costo_poliza', 'subsidio', 'prima_mensual',
            'total_ahorros', 'plan_era',
            'fecha_efectiva', 'estado', 'estado_nombre', 'estado_documento', 'flujo_etapa', 'fecha_envio', 'fecha_cancelacion',
            'id_interno', 'agente', 'agente_nombre', 'agente_registro', 'agente_registro_nombre', 'plan', 'plan_nombre', 'tipo_producto', 'tipo_producto_nombre',
            'aseguradora', 'aseguradora_nombre', 'nombre_plan', 'metal', 'id_plan_cms',
            'clientes_info', 'clientes_data', 'colaboradores', 'colaboradores_details',
            'ffm_mercado', 'npn_mercado', 'tipo_inscripcion', 'razon_inscripcion_especial', 'fecha_inscripcion_especial',
            'total_miembros', 'total_aplicantes', 'total_dependientes',
            'direccion_fisica', 'direccion_fisica_details',
            'direccion_postal', 'direccion_postal_details',
            'direccion_facturacion', 'direccion_facturacion_details',
            'notas_comentarios', 'info_medico_principal', 'medico_especializacion', 'medico_hospital',
            'medicamentos_necesarios', 'medicamentos_dosis',
            'info_pago', 'tarjetas_credito', 'cuentas_bancarias',
            'otras_polizas', 'notas', 'etiquetas', 'etiquetas_ids', 'documentos', 'citas',
            'medicamentos', 'medicos_principales', 'historial', 'recordatorios', 'transferencias',
            'request_user_role',
            'active_viewers',
            'ultima_actualizacion', 'es_duplicado', 'ultimo_duplicado'
        ]
        read_only_fields = ('agente_registro', 'agente_registro_nombre')

    def get_request_user_role(self, obj):
        return get_request_user_role(self)

    def get_plan_nombre(self, obj):
        if obj.nombre_plan:
            return obj.nombre_plan
        return obj.plan.nombre if obj.plan else None

    def get_aseguradora_nombre(self, obj):
        if obj.aseguradora:
            return obj.aseguradora.nombre
        if obj.plan and obj.plan.aseguradora:
            return obj.plan.aseguradora.nombre
        return None

    def _sync_plan(self, instance, validated_data):
        aseguradora = validated_data.get('aseguradora', instance.aseguradora if instance else None)
        tipo_producto = validated_data.get('tipo_producto', instance.tipo_producto if instance else None)
        nombre_plan = validated_data.get('nombre_plan', instance.nombre_plan if instance else None)
        id_plan_cms = validated_data.get('id_plan_cms', instance.id_plan_cms if instance else None)

        if not aseguradora or not tipo_producto or not nombre_plan:
            return

        plan = Plan.objects.filter(
            aseguradora=aseguradora,
            tipo_producto=tipo_producto,
            nombre=nombre_plan,
        ).first()

        if not plan:
            plan = Plan.objects.create(
                aseguradora=aseguradora,
                tipo_producto=tipo_producto,
                nombre=nombre_plan,
                id_plan_aseguradora=id_plan_cms or '',
            )
        elif id_plan_cms and plan.id_plan_aseguradora != id_plan_cms:
            plan.id_plan_aseguradora = id_plan_cms
            plan.save(update_fields=['id_plan_aseguradora'])

        validated_data['plan'] = plan

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

        if data.get('aseguradora') is None and instance.plan_id and instance.plan.aseguradora_id:
            data['aseguradora'] = instance.plan.aseguradora_id

        if not data.get('nombre_plan') and instance.plan_id:
            data['nombre_plan'] = instance.plan.nombre

        if not data.get('id_plan_cms') and instance.plan_id and instance.plan.id_plan_aseguradora:
            data['id_plan_cms'] = instance.plan.id_plan_aseguradora

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
        etiquetas = validated_data.pop('etiquetas', [])
        self._sync_plan(None, validated_data)
        poliza = Poliza.objects.create(**validated_data)
        
        if colaboradores:
            poliza.colaboradores.set(colaboradores)

        if etiquetas:
            poliza.etiquetas.set(etiquetas)

        for client_data in clientes_data:
            PolizaCliente.objects.create(poliza=poliza, **client_data)
            
        return poliza

    def update(self, instance, validated_data):
        clientes_data = validated_data.pop('clientes_data', None)
        colaboradores = validated_data.pop('colaboradores', None)
        etiquetas = validated_data.pop('etiquetas', None)

        self._sync_plan(instance, validated_data)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if colaboradores is not None:
            instance.colaboradores.set(colaboradores)

        if etiquetas is not None:
            instance.etiquetas.set(etiquetas)
        
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


class CambioDeVidaSerializer(serializers.ModelSerializer):
    asignado_a_username = serializers.ReadOnlyField(source='asignado_a.username')
    creado_por_username = serializers.ReadOnlyField(source='creado_por.username')
    poliza_id_mercado = serializers.ReadOnlyField(source='poliza.id_mercado')
    agente_nombre = serializers.ReadOnlyField(source='agente.nombre_completo')
    agente_creador_nombre = serializers.ReadOnlyField(source='agente_creador.nombre_completo')
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CambioDeVida
        fields = '__all__'
        read_only_fields = ('creado_por', 'agente', 'agente_creador', 'fecha_creacion', 'fecha_actualizacion')


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
            role = normalize_role(user.profile.role)
            if role == 'USER' and getattr(user.profile, 'cliente_id', None):
                return 'CLIENTE'
            return role
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

        from .client_portal import resolve_cliente_for_user
        resolve_cliente_for_user(self.user)
        if hasattr(self.user, 'profile'):
            self.user.profile.refresh_from_db()

        refresh = self.get_token(self.user)
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['role'] = self._resolve_user_role(self.user)
        data['username'] = self.user.username
        data['id'] = self.user.id
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name

        cliente = resolve_cliente_for_user(self.user)
        data['cliente_id'] = cliente.id if cliente else None

        return data



class ConfiguracionNotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionNotificacion
        fields = '__all__'

class TipoProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoProducto
        fields = '__all__'






