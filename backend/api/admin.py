from django.contrib import admin
from .models import Agencia, Direccion, Agente, Cliente, Aseguradora, Plan, Poliza, PolizaCliente, EstadoPoliza, Licencia, UserProfile, Nota, HistorialPoliza, Etiqueta, Documento, Tarea
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super(UserAdmin, self).get_inline_instances(request, obj)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register your models here.
admin.site.register(Agencia)
admin.site.register(Nota)
admin.site.register(HistorialPoliza)
admin.site.register(Etiqueta)
admin.site.register(Documento)
admin.site.register(Tarea)
admin.site.register(Direccion)
admin.site.register(Agente)
admin.site.register(Cliente)
admin.site.register(Aseguradora)
admin.site.register(Plan)
admin.site.register(Poliza)
admin.site.register(PolizaCliente)
admin.site.register(EstadoPoliza)
admin.site.register(Licencia)
