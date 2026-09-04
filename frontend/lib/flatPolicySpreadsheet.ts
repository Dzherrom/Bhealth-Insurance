'use client';

import * as XLSX from 'xlsx';

export async function parseFlatPolicySpreadsheet(
  file: File,
): Promise<{ headers: string[]; rows: unknown[][]; dataRowStartIndex: number }> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  let matrix: unknown[][];

  if (extension === 'csv') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
  }

  if (!matrix.length) {
    throw new Error('El archivo no contiene datos.');
  }

  const headers = (matrix[0] ?? []).map((cell) => String(cell ?? '').trim());
  const rows = matrix.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''));

  return { headers, rows, dataRowStartIndex: 2 };
}

export function chunkRows<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}
