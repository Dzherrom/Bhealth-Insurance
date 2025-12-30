from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, 
    EstadoPoliza, Poliza, PolizaCliente, Licencia, Nota, HistorialPoliza,
    Etiqueta, Documento
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

    class Meta:
        model = Poliza
        fields = [
            'id', 'id_mercado', 'id_miembro', 'costo_poliza', 'subsidio', 'prima_mensual',
            'fecha_efectiva', 'estado', 'estado_nombre', 'fecha_envio', 'fecha_cancelacion',
            'id_interno', 'agente', 'agente_nombre', 'plan', 'plan_nombre',
            'clientes_info', 'clientes_data'
        ]

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

