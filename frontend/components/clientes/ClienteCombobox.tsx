'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientesApi } from '@/lib/api';
import { getClienteDisplayName, getClienteSearchLabel } from '@/lib/clienteUtils';
import type { Cliente } from '@/types';

interface ClienteComboboxProps {
  value: Cliente | null;
  onChange: (cliente: Cliente | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClienteCombobox({
  value,
  onChange,
  placeholder = 'Buscar cliente existente...',
  disabled = false,
  className,
}: ClienteComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const list = await clientesApi.search(trimmed);
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const handleSelect = async (clienteId: number) => {
    try {
      const fullCliente = await clientesApi.get(clienteId);
      onChange(fullCliente);
      setOpen(false);
      setQuery('');
    } catch {
      const fallback = results.find((item) => item.id === clienteId) ?? null;
      onChange(fallback);
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate text-left">
              {value ? getClienteDisplayName(value) : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 z-[100]"
          align="start"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Command shouldFilter={false} className="overflow-hidden">
            <CommandInput
              placeholder="Nombre, email, teléfono o SSN..."
              value={query}
              onValueChange={setQuery}
            />
            <ScrollArea className="h-[260px]">
              <CommandList className="max-h-none overflow-visible">
                {isSearching ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando...
                  </div>
                ) : query.trim().length < 2 ? (
                  <CommandEmpty>Escribe al menos 2 caracteres.</CommandEmpty>
                ) : results.length === 0 ? (
                  <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {results.map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        value={String(cliente.id)}
                        onSelect={() => handleSelect(cliente.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            value?.id === cliente.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="truncate">{getClienteSearchLabel(cliente)}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Quitar cliente seleccionado"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
