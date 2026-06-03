import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='api_medicamento';")
    rows = cursor.fetchall()
    print('columns:', [r[0] for r in rows])
