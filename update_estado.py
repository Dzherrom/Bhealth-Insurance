import re

with open("backend/api/models.py", "r", encoding="utf-8") as f:
    text = f.read()

replacement = """class EstadoPoliza(models.Model):
    nombre = models.CharField(max_length=100, unique=True, verbose_name="Nombre Estado")
    color = models.CharField(max_length=7, default="#ef4444", verbose_name="Color Hexadecimal")
    disponible_para_agentes = models.BooleanField(default=True, verbose_name="¿Disponible para agentes?")

    def __str__(self):
        return f"{self.nombre}"
"""

text = re.sub(r"class EstadoPoliza\(models\.Model\):\s+nombre = models\.CharField.*?(?=\s+class Poliza)", replacement, text, flags=re.DOTALL)

with open("backend/api/models.py", "w", encoding="utf-8") as f:
    f.write(text)
print("EstadoPoliza updated")
