from django.contrib import admin
from .models import Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, Poliza, PolizaCliente, EstadoPoliza, Licencia

# Register your models here.
admin.site.register(Agencia)
admin.site.register(Direccion)
admin.site.register(Agente)
admin.site.register(Cliente)
admin.site.register(Aseguradora)
admin.site.register(Plan)
admin.site.register(Poliza)
admin.site.register(PolizaCliente)
admin.site.register(EstadoPoliza)
admin.site.register(Licencia)
