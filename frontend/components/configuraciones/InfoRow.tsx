import React from 'react';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
