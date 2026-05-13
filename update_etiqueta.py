import re

with open("backend/api/models.py", "r", encoding="utf-8") as f:
    text = f.read()

replacement = """class Etiqueta(models.Model):
    TIPO_CHOICES = [
        ("DOCUMENTO", "Documento"),
        ("POLIZA", "Póliza"),
    ]
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre Etiqueta")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="DOCUMENTO", verbose_name="Tipo de Etiqueta")
    descripcion = models.TextField(null=True, blank=True, verbose_name="Descripción")

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"
"""

text = re.sub(r"class Etiqueta\(models\.Model\):\s+nombre = models\.CharField.*?(?=\s+class Documento)", replacement, text, flags=re.DOTALL)

with open("backend/api/models.py", "w", encoding="utf-8") as f:
    f.write(text)
print("Etiqueta updated")
