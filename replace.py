import re

with open('frontend/app/crm/polizas/[id]/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement_str = '''{activeSection === 'recordatorios' && (
              <RecordatoriosPoliza polizaId={params.id as string} />
            )}

            {activeSection === 'pagos' && (
              <InfoPagoPoliza poliza={poliza} />
            )}
            
            {activeSection === 'direcciones' && (
              <DireccionesPoliza poliza={poliza} />
            )}
            
            {activeSection === 'metadatos' && (
              <MetadatosPoliza poliza={poliza} />
            )}
            
            {activeSection !== 'poliza' && activeSection !== 'documentos' && activeSection !== 'recordatorios' && activeSection !== 'pagos' && activeSection !== 'direcciones' && activeSection !== 'metadatos' && (
              <div className="text-center py-8 text-gray-500">
                <p>Sección en desarrollo: {activeSection}</p>
              </div>
            )}'''

text = re.sub(r'\{activeSection === \'recordatorios\'.*?</div>\s*\)\}', replacement_str, text, flags=re.DOTALL)

with open('frontend/app/crm/polizas/[id]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done replacing")
