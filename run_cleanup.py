import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('2.25.68.83', username='deploy')
    command = """
cd /var/www/Bhealth-Insurance/backend
source ../venv/bin/activate
python manage.py shell -c "
from api.models import Agente
print('Total agentes en BD:', Agente.objects.count())
print('Agentes actuales:')
for a in Agente.objects.all():
    print(f'- {a.nombre_completo} (ID: {a.id})')
"
"""
    stdin, stdout, stderr = client.exec_command(command)
    print('STDOUT:\n', stdout.read().decode('utf-8', 'ignore'))
finally:
    client.close()
