from django.db import migrations


AGENT_ROLES = ['ASISTENTE', 'SHERPA', 'MANAGER', 'ADMIN', 'PAGOS', 'CITAS']


def populate_ffm_and_link_users(apps, schema_editor):
    Agente = apps.get_model('api', 'Agente')
    UserProfile = apps.get_model('api', 'UserProfile')
    Agencia = apps.get_model('api', 'Agencia')

    for agente in Agente.objects.all():
        if not agente.ffm:
            agente.ffm = f'FFM-{agente.npn}'
            agente.save(update_fields=['ffm'])

    linked_agent_ids = set(
        UserProfile.objects.filter(agente__isnull=False).values_list('agente_id', flat=True)
    )
    free_agents = list(Agente.objects.exclude(id__in=linked_agent_ids).order_by('id'))
    agencia = Agencia.objects.first()

    for profile in UserProfile.objects.filter(
        role__in=AGENT_ROLES, agente__isnull=True
    ).select_related('user'):
        if free_agents:
            agente = free_agents.pop(0)
            profile.agente_id = agente.id
            profile.save(update_fields=['agente'])
            continue

        if not agencia:
            continue

        user = profile.user
        base_npn = f'NPN-{user.username.upper().replace("-", "_")[:40]}'
        npn = base_npn
        suffix = 1
        while Agente.objects.filter(npn=npn).exists():
            npn = f'{base_npn}-{suffix}'
            suffix += 1

        nombre = f'{user.first_name} {user.last_name}'.strip() or user.username
        agente = Agente.objects.create(
            npn=npn,
            ffm=f'FFM-{npn}',
            nombre_completo=nombre,
            agencia_id=agencia.id,
        )
        profile.agente_id = agente.id
        profile.save(update_fields=['agente'])


def reverse_populate(apps, schema_editor):
    Agente = apps.get_model('api', 'Agente')
    Agente.objects.update(ffm=None)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0050_agente_ffm_field'),
    ]

    operations = [
        migrations.RunPython(populate_ffm_and_link_users, reverse_populate),
    ]
