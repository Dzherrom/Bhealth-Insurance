import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from api.models import Poliza

qs = Poliza.objects.select_related('estado').filter(estado__nombre__icontains='cotiz')
print('cotiz count:', qs.count())
for p in qs[:5]:
    print(p.id, p.id_mercado, p.estado.nombre)

qs2 = Poliza.objects.select_related('estado').filter(estado__nombre__icontains='cotizada')
print('cotizada count:', qs2.count())
