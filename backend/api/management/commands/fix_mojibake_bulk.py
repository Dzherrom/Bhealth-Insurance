from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import (
    Agencia,
    Etiqueta,
    Plan,
    TipoProducto,
    Aseguradora,
    Cliente,
    Nota,
    Documento,
    EstadoPoliza,
)


def looks_like_mojibake(s: str) -> bool:
    if not s or not isinstance(s, str):
        return False
    return 'Ã' in s or 'Â' in s or '�' in s


def try_fix_mojibake(s: str) -> str:
    if not s or not isinstance(s, str):
        return s
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        try:
            # fallback
            return decodeURIComponent_escape(s)
        except Exception:
            return s


def decodeURIComponent_escape(s: str) -> str:
    # Python equivalent of decodeURIComponent(escape(s))
    try:
        return bytes(s, 'latin-1').decode('utf-8')
    except Exception:
        return s


MODEL_FIELDS = {
    'Agencia': (Agencia, ['nombre', 'nombre_legal', 'dba', 'telefono', 'email', 'titulo_portal', 'pie_email']),
    'Etiqueta': (Etiqueta, ['nombre', 'descripcion']),
    'Plan': (Plan, ['nombre']),
    'TipoProducto': (TipoProducto, ['nombre', 'descripcion']),
    'Aseguradora': (Aseguradora, ['nombre']),
    'Cliente': (Cliente, ['primer_nombre', 'segundo_nombre', 'apellido_paterno', 'apellido_materno', 'portal_user', 'portal_url']),
    'Nota': (Nota, ['contenido']),
    'Documento': (Documento, ['titulo']),
    'EstadoPoliza': (EstadoPoliza, ['nombre']),
}


class Command(BaseCommand):
    help = 'Escanea múltiples modelos en busca de mojibake y lo corrige (dry-run por defecto).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Aplicar cambios a la base de datos')

    def handle(self, *args, **options):
        apply_changes = options.get('apply', False)
        summary = {}

        for display, (model, fields) in MODEL_FIELDS.items():
            qs = model.objects.all()
            checked = 0
            fixed = 0
            self.stdout.write(f"\nProcesando modelo: {display} ({qs.count()} registros)")
            for obj in qs:
                changed = False
                checked += 1
                for field in fields:
                    val = getattr(obj, field, None)
                    if val and looks_like_mojibake(val):
                        new = try_fix_mojibake(val)
                        if new != val and not looks_like_mojibake(new):
                            self.stdout.write(f"  [OK] id={getattr(obj, 'id', '?')} campo={field}: '{val}' -> '{new}'")
                            setattr(obj, field, new)
                            changed = True
                        else:
                            self.stdout.write(f"  [WARN] id={getattr(obj, 'id', '?')} campo={field} no se pudo corregir automáticamente: '{val}'")
                if changed:
                    fixed += 1
                    if apply_changes:
                        try:
                            with transaction.atomic():
                                obj.save()
                        except Exception as e:
                            self.stdout.write(f"    [ERROR] al guardar id={getattr(obj, 'id', '?')}: {e}")
            summary[display] = {'checked': checked, 'fixed': fixed}

        self.stdout.write('\nResumen:')
        for k, v in summary.items():
            self.stdout.write(f"  {k}: inspeccionados={v['checked']} modificados={v['fixed']}")

        if not apply_changes:
            self.stdout.write('\nWARNING: no se aplicaron cambios. Reejecuta con --apply para persistir correcciones.')