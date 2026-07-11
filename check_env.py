import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('2.25.68.83', username='deploy')
    command = """
cd /var/www/Bhealth-Insurance/backend
source ../venv/bin/activate
python manage.py shell -c "
from api.models import Agente, UserProfile
from django.contrib.auth.models import User

print('Total agentes:', Agente.objects.count())
print('Agentes con user_profile:', Agente.objects.filter(user_profile__isnull=False).count())
print('UserProfiles totales:', UserProfile.objects.count())
"
"""
    stdin, stdout, stderr = client.exec_command(command)
    print('STDOUT:\n', stdout.read().decode('utf-8', 'ignore'))
    print('STDERR:\n', stderr.read().decode('utf-8', 'ignore'))
finally:
    client.close()
