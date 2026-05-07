from rest_framework import serializers
from .models import ConsentRequest, ConsentEvent

class ConsentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentEvent
        fields = '__all__'

class ConsentRequestSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    cliente_nombre = serializers.ReadOnlyField(source='cliente.__str__')
    events = ConsentEventSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConsentRequest
        fields = '__all__'
        read_only_fields = ['status', 'created_by', 'sent_at', 'signed_at', 'provider_envelope_id', 'signing_url', 'last_error']
