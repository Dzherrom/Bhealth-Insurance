from django.db import migrations, models
import django.db.models.deletion


def link_profiles_to_clientes_by_email(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('api', 'UserProfile')
    Cliente = apps.get_model('api', 'Cliente')

    for profile in UserProfile.objects.filter(cliente__isnull=True).select_related('user'):
        email = (profile.user.email or '').strip()
        if not email:
            continue
        cliente = Cliente.objects.filter(email__iexact=email).first()
        if cliente:
            profile.cliente_id = cliente.id
            profile.role = 'CLIENTE'
            profile.save(update_fields=['cliente', 'role'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0061_userprofile_npn_ssn'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='cliente',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='usuarios_portal',
                to='api.cliente',
                verbose_name='Cliente vinculado',
            ),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[
                    ('ADMIN', 'Admin'),
                    ('MANAGER', 'Manager'),
                    ('ASISTENTE', 'Asistente'),
                    ('SHERPA', 'Sherpa'),
                    ('PAGOS', 'Pagos'),
                    ('CITAS', 'Citas'),
                    ('CLIENTE', 'Cliente'),
                    ('USER', 'Usuario Básico'),
                ],
                default='USER',
                max_length=20,
            ),
        ),
        migrations.RunPython(link_profiles_to_clientes_by_email, migrations.RunPython.noop),
    ]
