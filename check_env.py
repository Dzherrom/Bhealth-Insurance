import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('2.25.68.83', username='deploy')
    stdin, stdout, stderr = client.exec_command('cd /var/www/Bhealth-Insurance && git pull && bash deploy/scripts/update-app.sh')
    print('STDOUT:\n', stdout.read().decode('utf-8', 'ignore'))
    print('STDERR:\n', stderr.read().decode('utf-8', 'ignore'))
finally:
    client.close()
