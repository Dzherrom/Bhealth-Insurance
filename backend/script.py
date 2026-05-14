import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.contrib.auth.models import User
from api.models import UserProfile
user, created = User.objects.get_or_create(username='dashboard_admin_test')
user.set_password('Admin12345!')
user.save()
profile, p_created = UserProfile.objects.get_or_create(user=user)
profile.role = 'ADMIN'
profile.status = 'ACTIVE'
profile.save()
print(f'User {user.username} created/updated.')
