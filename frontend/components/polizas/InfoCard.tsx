'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function InfoCard({ title, icon: Icon, children, className = '' }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export function InfoRow({ label, value, className = '' }: InfoRowProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <span className="text-gray-500 text-sm">{label}:</span>
      <div className="font-semibold">
        {typeof value === 'string' ? <p>{value}</p> : value}
      </div>
    </div>
  );
}