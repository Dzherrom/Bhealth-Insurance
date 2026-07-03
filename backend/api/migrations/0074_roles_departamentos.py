from django.db import migrations, models
import django.db.models.deletion

from api.roles import DEFAULT_DEPARTMENT_BY_ROLE, DEPARTMENT_CHOICES, LEGACY_ROLE_MAP, ROLE_CHOICES


DEPARTMENT_SEED = [
    ('RECEPCION', 'Recepción', 'Canalización de llamadas entrantes al área correspondiente.'),
    ('SOPORTE_CLIENTE', 'Soporte al Cliente', 'Gestión proactiva y retención de clientes existentes.'),
    ('GESTION_RESOLUCION', 'Gestión y Resolución', 'Bills, incidencias y programación de citas.'),
    ('AREA_COMERCIAL', 'Área Comercial', 'Ventas nuevas y creación de cuentas en el portal del cliente.'),
    ('HEALTH_SHERPA', 'Health Sherpa', 'Inscripción y cambios en el marketplace federal.'),
    ('AGENTES', 'Agentes', 'Inscripciones telefónicas cuando no se completan vía web.'),
    ('COBRANZA', 'Cobranza', 'Gestión oportuna de pagos de pólizas.'),
    ('RECUPERACION', 'Recuperación', 'Rescate y reactivación de cartera cancelada o en riesgo.'),
]


def seed_departments(apps, schema_editor):
    Departamento = apps.get_model('api', 'Departamento')
    for codigo, nombre, descripcion in DEPARTMENT_SEED:
        Departamento.objects.update_or_create(
            codigo=codigo,
            defaults={'nombre': nombre, 'descripcion': descripcion, 'activo': True},
        )


def migrate_legacy_roles(apps, schema_editor):
    UserProfile = apps.get_model('api', 'UserProfile')
    Departamento = apps.get_model('api', 'Departamento')
    MatrizPermisoRol = apps.get_model('api', 'MatrizPermisoRol')

    dept_by_code = {d.codigo: d for d in Departamento.objects.all()}

    for profile in UserProfile.objects.all().iterator():
        legacy_role = (profile.role or 'USER').upper()
        new_role = LEGACY_ROLE_MAP.get(legacy_role, legacy_role)
        if new_role != profile.role:
            profile.role = new_role

        if not profile.departamento_id:
            dept_code = DEFAULT_DEPARTMENT_BY_ROLE.get(new_role)
            if dept_code and dept_code in dept_by_code:
                profile.departamento_id = dept_by_code[dept_code].id

        profile.save(update_fields=['role', 'departamento'])

    for permiso in MatrizPermisoRol.objects.all().iterator():
        legacy_role = (permiso.role or '').upper()
        new_role = LEGACY_ROLE_MAP.get(legacy_role, legacy_role)
        if new_role != permiso.role:
            permiso.role = new_role
            permiso.save(update_fields=['role'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0073_agente_cliente_carpetas_remove_poliza_etiquetas'),
    ]

    operations = [
        migrations.CreateModel(
            name='Departamento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(choices=DEPARTMENT_CHOICES, max_length=30, unique=True)),
                ('nombre', models.CharField(max_length=120)),
                ('descripcion', models.TextField(blank=True, default='')),
                ('activo', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': 'Departamento',
                'verbose_name_plural': 'Departamentos',
                'ordering': ['nombre'],
            },
        ),
        migrations.AlterField(
            model_name='matrizpermisorol',
            name='role',
            field=models.CharField(choices=ROLE_CHOICES, max_length=30),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=ROLE_CHOICES,
                default='USER',
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='departamento',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='usuarios',
                to='api.departamento',
                verbose_name='Departamento',
            ),
        ),
        migrations.RunPython(seed_departments, migrations.RunPython.noop),
        migrations.RunPython(migrate_legacy_roles, migrations.RunPython.noop),
    ]
