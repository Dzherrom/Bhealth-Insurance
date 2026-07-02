from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Notificacion, Recordatorio

ANTELACION_DELTAS = {
    '30m': timedelta(minutes=30),
    '1h': timedelta(hours=1),
    '2h': timedelta(hours=2),
    '1d': timedelta(days=1),
    '3d': timedelta(days=3),
    '7d': timedelta(days=7),
}


def build_recordatorio_titulo(tipo: str, motivo: str = '') -> str:
    tipo_label = dict(Recordatorio.TIPO_CHOICES).get(tipo, tipo)
    motivo = (motivo or '').strip()
    if motivo:
        return f'{tipo_label} — {motivo}'
    return tipo_label


def get_vencimiento_datetime(recordatorio: Recordatorio) -> datetime:
    tz_name = recordatorio.zona_horaria or 'UTC'
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo('UTC')

    naive = datetime.combine(recordatorio.fecha_vencimiento, recordatorio.hora_vencimiento)
    return naive.replace(tzinfo=tz)


def get_notificacion_datetime(recordatorio: Recordatorio) -> datetime:
    delta = ANTELACION_DELTAS.get(recordatorio.antelacion, timedelta(hours=1))
    return get_vencimiento_datetime(recordatorio) - delta


def should_send_recordatorio_notification(recordatorio: Recordatorio, now=None) -> bool:
    if recordatorio.notificado or not recordatorio.establecer_recordatorio:
        return False

    now = now or timezone.now()
    notify_at = get_notificacion_datetime(recordatorio)
    return now >= notify_at


def send_recordatorio_notification(recordatorio: Recordatorio) -> Notificacion:
    tipo_label = recordatorio.get_tipo_display_label()
    antelacion_label = recordatorio.get_antelacion_display_label()
    poliza_ref = getattr(recordatorio.poliza, 'id_mercado', recordatorio.poliza_id)

    mensaje = (
        f'Recordatorio ({tipo_label}): vence el {recordatorio.fecha_vencimiento:%d/%m/%Y} '
        f'a las {recordatorio.hora_vencimiento:%H:%M}. '
        f'Alerta programada {antelacion_label.lower()}. Póliza {poliza_ref}.'
    )

    if recordatorio.descripcion:
        mensaje = f'{mensaje} {recordatorio.descripcion[:120]}'

    content_type = ContentType.objects.get_for_model(Recordatorio)
    notificacion = Notificacion.objects.create(
        usuario=recordatorio.usuario_notificar,
        mensaje=mensaje[:255],
        tipo='RECORDATORIO',
        content_type=content_type,
        object_id=recordatorio.id,
    )

    recordatorio.notificado = True
    recordatorio.fecha_notificacion = timezone.now()
    recordatorio.save(update_fields=['notificado', 'fecha_notificacion'])

    return notificacion


def process_due_recordatorio_notifications(now=None) -> int:
    now = now or timezone.now()
    sent = 0

    candidatos = Recordatorio.objects.filter(
        notificado=False,
        establecer_recordatorio=True,
    ).select_related('poliza', 'usuario_notificar')

    for recordatorio in candidatos:
        if should_send_recordatorio_notification(recordatorio, now=now):
            send_recordatorio_notification(recordatorio)
            sent += 1

    return sent
