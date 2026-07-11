import subprocess

cmd = [
    "sshpass", "-p", "Carabobo27.#",
    "ssh", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null",
    "root@2.25.68.83",
    "cat /var/www/Bhealth-Insurance/backend/.env"
]

result = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
