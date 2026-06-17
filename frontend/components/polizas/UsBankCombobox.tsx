'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { US_BANKS } from '@/lib/usBanks';

interface UsBankComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
}

export function UsBankCombobox({
  value,
  onChange,
  id,
  name,
  placeholder = 'Seleccionar banco...',
  required,
}: UsBankComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const banks = React.useMemo(() => {
    if (value && !US_BANKS.includes(value as (typeof US_BANKS)[number])) {
      return [value, ...US_BANKS];
    }
    return US_BANKS;
  }, [value]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 z-[100]"
          align="start"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Command className="overflow-hidden">
            <CommandInput placeholder="Buscar banco..." />
            <ScrollArea className="h-[240px]">
              <CommandList className="max-h-none overflow-visible">
                <CommandEmpty>No se encontró el banco.</CommandEmpty>
                <CommandGroup>
                  {banks.map((bank) => (
                    <CommandItem
                      key={bank}
                      value={bank}
                      onSelect={() => {
                        onChange(bank);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === bank ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {bank}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
    </>
  );
}
