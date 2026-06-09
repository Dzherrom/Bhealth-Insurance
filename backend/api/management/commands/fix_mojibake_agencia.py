from django.core.management.base import BaseCommand

from api.models import Agencia


def looks_like_mojibake(s: str) -> bool:
    if not s or not isinstance(s, str):
        return False
    return 'Ã' in s or 'Â' in s or '�' in s


def try_fix_mojibake(s: str) -> str:
    """Attempt to fix mojibake where UTF-8 bytes were decoded as Latin-1.

    Strategy: re-encode the Python str as latin-1 bytes then decode as utf-8.
    If that fails, return original string.
    """
    if not s or not isinstance(s, str):
        return s
    try:
        fixed = s.encode('latin-1').decode('utf-8')
        return fixed
    except Exception:
        return s


class Command(BaseCommand):
    help = 'Detecta y corrige mojibake en campos de Agencia (dry-run por defecto).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Aplicar cambios a la base de datos')

    def handle(self, *args, **options):
        apply_changes = options.get('apply', False)
        fields = ['nombre', 'nombre_legal', 'dba', 'telefono', 'email', 'titulo_portal', 'pie_email']

        total_checked = 0
        total_fixed = 0
        updated_ids = []

        qs = Agencia.objects.all()
        self.stdout.write(f"Revisando {qs.count()} agencias...\n")

        for ag in qs:
            changed = False
            total_checked += 1
            for field in fields:
                val = getattr(ag, field, None)
                if val and looks_like_mojibake(val):
                    fixed = try_fix_mojibake(val)
                    if fixed != val and not looks_like_mojibake(fixed):
                        self.stdout.write(f"[OK] Agencia id={ag.id} campo={field}: '{val}' -> '{fixed}'\n")
                        setattr(ag, field, fixed)
                        changed = True
                    else:
                        # If fixed still looks bad, log for manual inspection
                        if fixed != val:
                            self.stdout.write(f"[WARN] Agencia id={ag.id} campo={field} cambio inseguro: '{val}' -> '{fixed}'\n")
                        else:
                            self.stdout.write(f"[SKIP] Agencia id={ag.id} campo={field} no se pudo corregir automáticamente: '{val}'\n")

            if changed:
                total_fixed += 1
                updated_ids.append(ag.id)
                if apply_changes:
                    ag.save()

        self.stdout.write('\n')
        self.stdout.write(f"Agencias inspeccionadas: {total_checked}\n")
        self.stdout.write(f"Agencias modificadas: {total_fixed}\n")
        if updated_ids:
            self.stdout.write(f"IDs actualizados: {updated_ids}\n")
        if not apply_changes:
            self.stdout.write('\nWARNING: no se aplicaron cambios. Vuelve a ejecutar con --apply para persistir las correcciones.\n')