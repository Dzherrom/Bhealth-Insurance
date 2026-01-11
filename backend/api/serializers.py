from django.contrib.auth.models import User, Group
from rest_framework import serializers
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, PolizaCliente, Licencia, Nota, HistorialPoliza,
    Etiqueta, Documento, Tarea, UserProfile,
    InfoPago, TarjetaCredito, CuentaBancaria
)

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

class AgenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agencia
        fields = '__all__'

class DireccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direccion
        fields = '__all__'

class AgenteSerializer(serializers.ModelSerializer):
    agencia_nombre = serializers.ReadOnlyField(source='agencia.nombre')
    
    class Meta:
        model = Agente
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

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

class TarjetaCreditoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TarjetaCredito
        fields = '__all__'

class CuentaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaBancaria
        fields = '__all__'

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

class PolizaSerializer(serializers.ModelSerializer):
    clientes_info = PolizaClienteSerializer(source='polizacliente_set', many=True, read_only=True)
    # To allow creating relationships on create/update
    clientes_data = PolizaClienteSerializer(many=True, write_only=True, required=False)
    
    agente_nombre = serializers.ReadOnlyField(source='agente.nombre_completo')
    plan_nombre = serializers.ReadOnlyField(source='plan.nombre')
    estado_nombre = serializers.ReadOnlyField(source='estado.nombre')
    colaboradores_details = UserSerializer(source='colaboradores', many=True, read_only=True)

    # Address Details
    direccion_fisica_details = DireccionSerializer(source='direccion_fisica', read_only=True)
    direccion_postal_details = DireccionSerializer(source='direccion_postal', read_only=True)
    direccion_facturacion_details = DireccionSerializer(source='direccion_facturacion', read_only=True)

    # Payment Info
    info_pago = InfoPagoSerializer(read_only=True)
    tarjetas_credito = TarjetaCreditoSerializer(many=True, read_only=True)
    cuentas_bancarias = CuentaBancariaSerializer(many=True, read_only=True)
    otras_polizas = serializers.SerializerMethodField()

    class Meta:
        model = Poliza
        fields = [
            'id', 'id_mercado', 'id_miembro', 'costo_poliza', 'subsidio', 'prima_mensual',
            'total_ahorros', 'plan_era',
            'fecha_efectiva', 'estado', 'estado_nombre', 'fecha_envio', 'fecha_cancelacion',
            'id_interno', 'agente', 'agente_nombre', 'plan', 'plan_nombre',
            'clientes_info', 'clientes_data', 'colaboradores', 'colaboradores_details',
            'ffm_mercado', 'npn_mercado', 'tipo_inscripcion', 'razon_inscripcion_especial', 'fecha_inscripcion_especial',
            'total_miembros', 'total_aplicantes', 'total_dependientes',
            'direccion_fisica', 'direccion_fisica_details',
            'direccion_postal', 'direccion_postal_details',
            'direccion_facturacion', 'direccion_facturacion_details',
            'info_pago', 'tarjetas_credito', 'cuentas_bancarias', 'otras_polizas',
            'ultima_actualizacion', 'es_duplicado', 'ultimo_duplicado'
        ]

    def get_otras_polizas(self, obj):
        main_applicant_link = obj.polizacliente_set.filter(es_solicitante_principal=True).first()
        if main_applicant_link:
            other_policies = Poliza.objects.filter(clientes=main_applicant_link.cliente).exclude(id=obj.id).distinct()
            return [{"id": p.id, "id_mercado": p.id_mercado, "estado": p.estado.nombre if p.estado else None} for p in other_policies]
        return []

    def create(self, validated_data):
        clientes_data = validated_data.pop('clientes_data', [])
        poliza = Poliza.objects.create(**validated_data)
        
        for client_data in clientes_data:
            PolizaCliente.objects.create(poliza=poliza, **client_data)
            
        return poliza

    def update(self, instance, validated_data):
        clientes_data = validated_data.pop('clientes_data', None)
        
        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update relationships if provided
        if clientes_data is not None:
            # For simplicity, we might clear existing and re-add, or try to match.
            # A simple approach for now: remove all and re-add
            instance.polizacliente_set.all().delete()
            for client_data in clientes_data:
                PolizaCliente.objects.create(poliza=instance, **client_data)
                
        return instance

class NotaSerializer(serializers.ModelSerializer):
    autor_username = serializers.ReadOnlyField(source='autor.username')
    usuarios_etiquetados_names = serializers.SlugRelatedField(
        many=True, 
        read_only=True, 
        slug_field='username', 
        source='usuarios_etiquetados'
    )

    class Meta:
        model = Nota
        fields = '__all__'
        read_only_fields = ('autor', 'fecha_creacion', 'usuarios_etiquetados')

class HistorialPolizaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.ReadOnlyField(source='usuario.username')
    
    class Meta:
        model = HistorialPoliza
        fields = '__all__'

class EtiquetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etiqueta
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    subido_por_username = serializers.ReadOnlyField(source='subido_por.username')
    etiquetas_details = EtiquetaSerializer(source='etiquetas', many=True, read_only=True)
    etiquetas_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Etiqueta.objects.all(), source='etiquetas'
    )

    class Meta:
        model = Documento
        fields = '__all__'
        read_only_fields = ('subido_por', 'fecha_subida')

class TareaSerializer(serializers.ModelSerializer):
    asignado_a_username = serializers.ReadOnlyField(source='asignado_a.username')
    creado_por_username = serializers.ReadOnlyField(source='creado_por.username')
    poliza_id_mercado = serializers.ReadOnlyField(source='poliza.id_mercado')

    class Meta:
        model = Tarea
        fields = '__all__'
        read_only_fields = ('creado_por', 'fecha_creacion')

