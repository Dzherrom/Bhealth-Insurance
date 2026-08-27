import { mdToPdf } from 'md-to-pdf';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const stylesheet = path.join(__dirname, 'pdf-styles.css');

const files = [
  'BACKEND_DOC.md',
  'FRONTEND_DOC.MD',
  'GUIA_EMPLEADO_CRM.md',
  'VPS_DEPLOY_UBUNTU.md',
];

const pdfOptions = {
  format: 'A4',
  margin: {
    top: '18mm',
    right: '16mm',
    bottom: '20mm',
    left: '16mm',
  },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="font-size:8px;width:100%;text-align:center;color:#64748b;padding:0 16mm;">' +
    '<span class="pageNumber"></span> / <span class="totalPages"></span>' +
    '</div>',
};

const launchOptions = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};

for (const file of files) {
  const inputPath = path.join(rootDir, file);
  const outputPath = path.join(rootDir, file.replace(/\.md$/i, '.pdf'));

  console.log(`Convirtiendo: ${file} -> ${path.basename(outputPath)}`);

  const pdf = await mdToPdf(
    { path: inputPath },
    {
      basedir: rootDir,
      dest: outputPath,
      stylesheet: [stylesheet],
      body_class: ['markdown-body'],
      page_media_type: 'print',
      highlight_style: 'github',
      pdf_options: pdfOptions,
      launch_options: launchOptions,
      md_file_encoding: 'utf-8',
    },
  );

  if (!pdf) {
    throw new Error(`No se pudo generar PDF para ${file}`);
  }

  console.log(`  OK: ${outputPath}`);
}

console.log('\nPDFs generados correctamente.');
