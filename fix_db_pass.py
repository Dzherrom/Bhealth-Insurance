import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('2.25.68.83', username='deploy', password='Carabobo27.#')
    
    commands = [
        # 1. Reset PostgreSQL password
        "echo 'Carabobo27.#' | sudo -S su - postgres -c \"psql -c \\\"ALTER USER lumina_administrator PASSWORD 'LuminaDB_2026!';\\\"\"",
        
        # 2. Update the .env file with the new password
        "echo 'Carabobo27.#' | sudo -S sed -i 's/CHANGE_ME@localhost/LuminaDB_2026!@localhost/g' /var/www/Bhealth-Insurance/backend/.env",
        "echo 'Carabobo27.#' | sudo -S sed -i 's/DJANGO_SUPERUSER_PASSWORD=CHANGE_ME/DJANGO_SUPERUSER_PASSWORD=Carabobo27.#/g' /var/www/Bhealth-Insurance/backend/.env",
        
        # 3. Check the .env file
        "echo 'Carabobo27.#' | sudo -S cat /var/www/Bhealth-Insurance/backend/.env | grep DATABASE_URL",
        
        # 4. Restart the backend
        "echo 'Carabobo27.#' | sudo -S systemctl restart lumina-backend"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print('STDOUT:', stdout.read().decode('utf-8', 'ignore').strip())
        print('STDERR:', stderr.read().decode('utf-8', 'ignore').strip())
        print("-" * 40)
finally:
    client.close()
