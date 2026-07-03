"""Presencia en tiempo real y bloqueo de edición concurrente en pólizas."""

from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

PRESENCE_TTL = timedelta(seconds=90)
EDIT_LOCK_TTL = timedelta(minutes=10)


def _display_name(user) -> str:
    name = f'{user.first_name} {user.last_name}'.strip()
    return name or user.username


def cleanup_stale_viewers(poliza_id: int) -> None:
    from .models import PolizaViewer

    threshold = timezone.now() - PRESENCE_TTL
    PolizaViewer.objects.filter(poliza_id=poliza_id, last_seen__lt=threshold).delete()


def get_active_viewers_queryset(poliza):
    from .models import PolizaViewer

    cleanup_stale_viewers(poliza.id)
    threshold = timezone.now() - PRESENCE_TTL
    return PolizaViewer.objects.filter(
        poliza=poliza,
        last_seen__gte=threshold,
    ).select_related('usuario', 'usuario__profile')


def serialize_viewer(viewer) -> dict:
    return {
        'user_id': viewer.usuario_id,
        'username': viewer.usuario.username,
        'display_name': _display_name(viewer.usuario),
        'mode': viewer.mode,
        'last_seen': viewer.last_seen.isoformat(),
        'opened_at': viewer.opened_at.isoformat() if viewer.opened_at else viewer.last_seen.isoformat(),
    }


def get_edit_lock_holder(poliza):
    from .models import PolizaViewer

    threshold = timezone.now() - EDIT_LOCK_TTL
    return (
        PolizaViewer.objects.filter(
            poliza=poliza,
            mode='EDIT',
            last_seen__gte=threshold,
        )
        .select_related('usuario')
        .first()
    )


def can_user_edit(poliza, user) -> bool:
    if user.is_superuser:
        return True
    lock = get_edit_lock_holder(poliza)
    if not lock:
        return True
    return lock.usuario_id == user.id


def touch_presence(poliza, user, mode: str = 'VIEW'):
    from .models import PolizaViewer

    viewer, _created = PolizaViewer.objects.update_or_create(
        poliza=poliza,
        usuario=user,
        defaults={'mode': mode},
    )
    if viewer.mode != mode:
        viewer.mode = mode
        viewer.save(update_fields=['mode', 'last_seen'])
    else:
        viewer.save(update_fields=['last_seen'])
    return viewer


def leave_presence(poliza, user) -> None:
    from .models import PolizaViewer

    PolizaViewer.objects.filter(poliza=poliza, usuario=user).delete()


def try_acquire_edit_lock(poliza, user):
    cleanup_stale_viewers(poliza.id)
    lock = get_edit_lock_holder(poliza)
    if lock and lock.usuario_id != user.id:
        return False, serialize_viewer(lock)
    touch_presence(poliza, user, 'EDIT')
    return True, None


def assert_edit_allowed(poliza, user) -> None:
    if can_user_edit(poliza, user):
        return
    lock = get_edit_lock_holder(poliza)
    name = _display_name(lock.usuario) if lock else 'otro usuario'
    raise PermissionDenied(
        f'La póliza está siendo editada por {name}. Solo lectura disponible.'
    )


def build_presence_response(poliza, user) -> dict:
    viewers = get_active_viewers_queryset(poliza)
    lock = get_edit_lock_holder(poliza)
    return {
        'viewers': [serialize_viewer(v) for v in viewers],
        'edit_lock': serialize_viewer(lock) if lock else None,
        'can_edit': can_user_edit(poliza, user),
        'is_locked_by_other': bool(lock and lock.usuario_id != user.id),
    }
