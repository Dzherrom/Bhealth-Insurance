from django.db import migrations, models


def copy_agente_npn_to_profile(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')
    for profile in UserProfile.objects.filter(agente__isnull=False, npn__isnull=True).select_related('agente'):
        if profile.agente.npn:
            profile.npn = profile.agente.npn
            profile.save(update_fields=['npn'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0060_medicopoliza'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='npn',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='NPN'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='ssn',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='SSN'),
        ),
        migrations.RunPython(copy_agente_npn_to_profile, migrations.RunPython.noop),
    ]
