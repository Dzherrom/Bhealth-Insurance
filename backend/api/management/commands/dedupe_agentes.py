from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count
from django.db.models.functions import Lower, Trim

from api.models import Agente, Cliente, Contrato, Licencia, Poliza, ReporteComision, UserProfile


def normalize_key(value: str) -> str:
    return (value or "").strip().upper()


class Command(BaseCommand):
    help = (
        "Deduplicate Agente rows and re-link references (polizas/clientes/etc). "
        "Defaults to dry-run (safe)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Apply changes (otherwise only reports).",
        )
        parser.add_argument(
            "--by-name-only",
            action="store_true",
            help=(
                "Only deduplicate by normalized nombre_completo (ignores NPN grouping). "
                "Useful for fictitious/demo datasets."
            ),
        )
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=5000,
            help="Iterator chunk size for large datasets.",
        )

    def handle(self, *args, **options):
        apply_changes = bool(options["apply"])
        by_name_only = bool(options["by_name_only"])
        chunk_size = int(options["chunk_size"])

        if apply_changes:
            self.stdout.write(self.style.WARNING("APPLY mode: changes will be written."))
        else:
            self.stdout.write(self.style.NOTICE("DRY-RUN mode: no changes will be written."))

        groups = []
        if not by_name_only:
            groups.extend(self._build_groups_by_normalized_npn(chunk_size=chunk_size))
        groups.extend(self._build_groups_by_normalized_name())

        # Remove duplicate groups (same ids in different order)
        seen = set()
        unique_groups = []
        for agent_ids in groups:
            frozen = tuple(sorted(agent_ids))
            if len(frozen) < 2 or frozen in seen:
                continue
            seen.add(frozen)
            unique_groups.append(list(frozen))

        if not unique_groups:
            self.stdout.write(self.style.SUCCESS("No duplicate agents found."))
            return

        total_deleted = 0
        total_updates = 0

        for idx, agent_ids in enumerate(unique_groups, start=1):
            with transaction.atomic():
                deleted, updates = self._dedupe_group(agent_ids, apply_changes=apply_changes)
                total_deleted += deleted
                total_updates += updates

            if idx % 25 == 0:
                self.stdout.write(f"Processed {idx}/{len(unique_groups)} groups...")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. groups={len(unique_groups)} updates={total_updates} deleted={total_deleted}"
            )
        )

    def _build_groups_by_normalized_npn(self, *, chunk_size: int):
        buckets = defaultdict(list)
        for agente in Agente.objects.only("id", "npn").order_by("id").iterator(chunk_size=chunk_size):
            key = normalize_key(agente.npn)
            if key:
                buckets[key].append(agente.id)
        return [ids for _, ids in buckets.items() if len(ids) > 1]

    def _build_groups_by_normalized_name(self):
        # Group by normalized name to match the DB unique constraint.
        dup_norms = list(
            Agente.objects.annotate(norm=Lower(Trim("nombre_completo")))
            .values("norm")
            .annotate(c=Count("id"))
            .filter(c__gt=1)
            .values_list("norm", flat=True)
        )

        groups = []
        for norm in dup_norms:
            ids = list(
                Agente.objects.annotate(norm=Lower(Trim("nombre_completo")))
                .filter(norm=norm)
                .values_list("id", flat=True)
                .order_by("id")
            )
            if len(ids) > 1:
                groups.append(ids)
        return groups


    def _pick_canonical_id(self, agent_ids):
        # Prefer agent with linked profile; otherwise lowest id.
        profile_agent_ids = set(
            UserProfile.objects.filter(agente_id__in=agent_ids).values_list("agente_id", flat=True)
        )
        if profile_agent_ids:
            return min(profile_agent_ids)
        return min(agent_ids)

    def _dedupe_group(self, agent_ids, *, apply_changes: bool):
        agents = list(
            Agente.objects.filter(id__in=agent_ids).select_related("agencia").order_by("id")
        )
        if len(agents) < 2:
            return 0, 0

        canonical_id = self._pick_canonical_id(agent_ids)
        canonical = next((a for a in agents if a.id == canonical_id), agents[0])

        dup_ids = [a.id for a in agents if a.id != canonical.id]
        if not dup_ids:
            return 0, 0

        if not apply_changes:
            self.stdout.write(
                f"DRY-RUN group: canonical={canonical.id} name={canonical.nombre_completo} dup_count={len(dup_ids)}"
            )
            return 0, 0

        updates = 0
        updates += Cliente.objects.filter(agente_id__in=dup_ids).update(agente=canonical)
        updates += Poliza.objects.filter(agente_id__in=dup_ids).update(agente=canonical)
        updates += Poliza.objects.filter(agente_registro_id__in=dup_ids).update(agente_registro=canonical)
        updates += Licencia.objects.filter(agente_id__in=dup_ids).update(agente=canonical)
        updates += Contrato.objects.filter(agente_id__in=dup_ids).update(agente=canonical)
        updates += ReporteComision.objects.filter(agente_id__in=dup_ids).update(agente=canonical)

        canonical_profile = UserProfile.objects.filter(agente_id=canonical.id).first()
        for profile in UserProfile.objects.filter(agente_id__in=dup_ids):
            if canonical_profile is None:
                profile.agente = canonical
                profile.save(update_fields=["agente"])
                canonical_profile = profile
                updates += 1
            else:
                profile.agente = None
                profile.save(update_fields=["agente"])
                updates += 1

        deleted, _ = Agente.objects.filter(id__in=dup_ids).delete()
        return deleted, updates
