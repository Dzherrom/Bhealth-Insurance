"""
Create or update the CRM super-admin (Django superuser + UserProfile SUPER_ADMIN).

Idempotent: safe to run on every deploy.
"""

from __future__ import annotations

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import UserProfile


DEFAULT_USERNAME = 'lumina-admin'
DEFAULT_EMAIL = 'admin@lumina.local'
DEFAULT_PASSWORD = 'ChangeMeInProduction!'


class Command(BaseCommand):
    help = (
        'Ensures a Django superuser exists with CRM role SUPER_ADMIN '
        '(for /admin/ and CRM login). Reads DJANGO_SUPERUSER_* env vars.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            default=os.environ.get('DJANGO_SUPERUSER_USERNAME', DEFAULT_USERNAME),
        )
        parser.add_argument(
            '--email',
            default=os.environ.get('DJANGO_SUPERUSER_EMAIL', DEFAULT_EMAIL),
        )
        parser.add_argument(
            '--password',
            default=os.environ.get('DJANGO_SUPERUSER_PASSWORD', DEFAULT_PASSWORD),
        )
        parser.add_argument(
            '--update-password',
            action='store_true',
            help='Reset password even if the user already exists.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        username = (options['username'] or DEFAULT_USERNAME).strip()
        email = (options['email'] or DEFAULT_EMAIL).strip()
        password = options['password'] or DEFAULT_PASSWORD
        update_password = bool(options['update_password'])

        if not username or not password:
            self.stderr.write(self.style.ERROR('Username and password are required.'))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            },
        )

        if created:
            user.set_password(password)
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save()
            action = 'created'
        else:
            changed = False
            if not user.is_superuser or not user.is_staff or not user.is_active:
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                changed = True
            if email and user.email != email:
                user.email = email
                changed = True
            if update_password:
                user.set_password(password)
                changed = True
            if changed:
                user.save()
            action = 'updated' if changed else 'exists'

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile_updates = []
        if profile.role != 'SUPER_ADMIN':
            profile.role = 'SUPER_ADMIN'
            profile_updates.append('role')
        if profile.status != 'ACTIVE':
            profile.status = 'ACTIVE'
            profile_updates.append('status')
        if profile.cliente_id is not None:
            profile.cliente = None
            profile_updates.append('cliente')
        if profile_updates:
            profile.save(update_fields=profile_updates)

        self.stdout.write(
            self.style.SUCCESS(
                f'CRM super-admin {action}: username={username!r} role=SUPER_ADMIN '
                f'(Django admin: /admin/ — CRM: /auth/login)'
            )
        )
