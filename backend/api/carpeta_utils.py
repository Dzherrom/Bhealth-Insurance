from .models import CarpetaDocumento, Documento

DEFAULT_CARPETAS = [
    ('CARTA_MERCADO', 'Carta de Mercado', 1),
    ('ASEGURANZA', 'Aseguranza', 2),
    ('CITAS_MEDICAS', 'Citas Médicas', 3),
    ('BILLS', 'Bills', 4),
    ('IDENTIFICACION', 'Identificación', 5),
    ('ESTATUS_MIGRATORIO', 'Estatus Migratorio', 6),
    ('CONSENTIMIENTO', 'Consentimiento', 7),
    ('OTRO', 'Otro', 8),
]


def ensure_poliza_carpetas(poliza):
    for codigo, nombre, orden in DEFAULT_CARPETAS:
        CarpetaDocumento.objects.get_or_create(
            poliza=poliza,
            codigo=codigo,
            defaults={
                'nombre': nombre,
                'orden': orden,
                'es_personalizada': False,
            },
        )

    for doc in Documento.objects.filter(poliza=poliza, carpeta__isnull=True):
        carpeta = CarpetaDocumento.objects.filter(poliza=poliza, codigo=doc.categoria).first()
        if not carpeta:
            carpeta = CarpetaDocumento.objects.filter(poliza=poliza, codigo='OTRO').first()
        if carpeta:
            doc.carpeta = carpeta
            doc.save(update_fields=['carpeta'])
