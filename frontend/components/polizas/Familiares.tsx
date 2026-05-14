'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Edit, Users, Phone, Mail, FileText, Calendar, DollarSign, Briefcase } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function Familiares({ familiares, onEdit, onDelete, onAdd }: any) {
  // Masker for SSN
  const maskSSN = (ssn: string) => ssn ? `***-**-${ssn.slice(-4)}` : 'N/A';
  // Masker for Email
  const maskEmail = (email: string) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return '***@' + domain;
  };
  // Masker for Phone
  const maskPhone = (phone: string) => phone ? '***-***-' + phone.slice(-4) : 'N/A';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Familias Asociadas</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Buscar contacto
          </Button>
          <Button size="sm" onClick={onAdd}>
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-gray-600 flex items-center space-x-4">
          <Badge variant="outline">Dependientes: {familiares?.length || 0}</Badge>
        </div>

        {(!familiares || familiares.length === 0) ? (
          <div className="text-center text-muted-foreground py-8">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay familiares registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Categoría</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Seguridad (SSN)</TableHead>
                  <TableHead>Biométrica</TableHead>
                  <TableHead>Ingresos / Trabajo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familiares.map((fam: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Users className="w-4 h-4"/>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {fam.cliente_details?.primer_nombre || fam.nombre} {fam.cliente_details?.apellido_paterno || fam.apellido}
                          </span>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge variant="secondary" className="px-1 py-0">{fam.relacion}</Badge>
                            {fam.es_solicitante_principal ? <Badge variant="default" className="px-1 py-0">Aplicante P.</Badge> : <Badge variant="outline" className="px-1 py-0">Dependiente</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-slate-500 space-y-1">
                         <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/> {maskPhone(fam.cliente_details?.telefono || fam.telefono)}</span>
                         <span className="flex items-center"><Mail className="w-3 h-3 mr-1"/> {maskEmail(fam.cliente_details?.email || fam.email)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                         <FileText className="w-3 h-3 mr-1"/> {maskSSN(fam.cliente_details?.ssn)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-slate-500 space-y-1">
                         <span className="flex items-center capitalize"><UserPlus className="w-3 h-3 mr-1"/> {fam.cliente_details?.genero || 'N/A'}</span>
                         <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {fam.cliente_details?.fecha_nacimiento || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col text-xs text-slate-500 space-y-1">
                         <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1 text-green-600"/> </span>
                         <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1"/> Auth: {fam.cliente_details?.categoria_inmigracion || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(fam.id)}><Edit className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onDelete(fam.id)}><UserMinus className="w-4 h-4"/></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
