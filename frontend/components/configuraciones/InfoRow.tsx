import React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

// Fix common mojibake where UTF-8 bytes were interpreted as Latin-1
const fixMojibake = (s: string) => {
  if (!s || typeof s !== 'string') return s;
  // Quick heuristic: mojibake often contains 'Ã' or 'Â'
  if (!/[ÃÂ]/.test(s)) return s;

  try {
    const bytes = Uint8Array.from(s.split('').map((c) => c.charCodeAt(0)));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    try {
      // Fallback for older browsers/environments
      // eslint-disable-next-line no-undef
      // @ts-ignore
      return decodeURIComponent(escape(s));
    } catch {
      return s;
    }
  }
};

export function InfoRow({ label, value }: InfoRowProps) {
  const renderedLabel = typeof label === 'string' ? fixMojibake(label) : label;

  let renderedValue: React.ReactNode = value;
  if (typeof value === 'string') {
    renderedValue = fixMojibake(value);
  }

  return (
    <div className="flex justify-between items-center py-2 border-b">
      <p className="text-sm text-gray-500">{renderedLabel}</p>
      <p className="font-medium text-sm">{renderedValue}</p>
    </div>
  );
}
