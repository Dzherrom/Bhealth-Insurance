import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

command = """
cd /var/www/Bhealth-Insurance/backend
/var/www/Bhealth-Insurance/venv/bin/python3 manage.py shell -c "
from api.models import Agente, UserProfile
from django.contrib.auth.models import User

print('Total agentes:', Agente.objects.count())

users = User.objects.filter(is_staff=True)
for u in users:
    profile, _ = UserProfile.objects.get_or_create(user=u)
    if not profile.agente:
        agente = Agente.objects.filter(nombre_completo__icontains=u.username).first()
        if not agente:
            agente = Agente.objects.exclude(user_profile__isnull=False).first()
        if not agente:
            agente = Agente.objects.first()
        if agente:
            profile.agente = agente
            profile.save()
            print(f'Linked {u.username} to {agente.nombre_completo}')

print('Agentes con user_profile:', Agente.objects.filter(user_profile__isnull=False).count())
"
"""

try:
    client.connect('2.25.68.83', username='deploy', password='Carabobo27.#')
    stdin, stdout, stderr = client.exec_command(command)
    print('STDOUT:', stdout.read().decode('utf-8', 'ignore'))
    print('STDERR:', stderr.read().decode('utf-8', 'ignore'))
finally:
    client.close()
