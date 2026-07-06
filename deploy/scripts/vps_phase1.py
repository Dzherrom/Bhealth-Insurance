from django.contrib.auth import get_user_model
from api.permissions import has_matrix_permission

u = get_user_model().objects.get(username="lumina-admin")
p = u.profile
print("is_superuser", u.is_superuser)
print("profile.role", p.role)
print("profile.status", p.status)
for m, a in [("POLIZA_FLUJO", "CREAR"), ("DOCUMENTOS", "CREAR"), ("CITAS", "CREAR"), ("RECORDATORIOS", "CREAR")]:
    print(m, a, has_matrix_permission(u, m, a))
