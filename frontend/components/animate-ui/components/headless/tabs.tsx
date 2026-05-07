import * as React from 'react';
import { motion } from 'motion/react';
import {
  TabGroup as HeadlessTabGroup,
  TabList as HeadlessTabList,
  Tab as HeadlessTab,
  TabPanels as HeadlessTabPanels,
  TabPanel as HeadlessTabPanel,
} from '@headlessui/react';
import { cn } from '@/lib/utils';

interface TabGroupProps {
  children: React.ReactNode;
  className?: string;
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

function TabGroup({ className, children, defaultIndex, onChange }: TabGroupProps) {
  return (
    <HeadlessTabGroup
      defaultIndex={defaultIndex}
      onChange={onChange}
      className={cn('flex flex-col gap-2', className)}
    >
      {children}
    </HeadlessTabGroup>
  );
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

function TabList({ className, children }: TabListProps) {
  return (
    <div className="relative">
      <HeadlessTabList
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]',
          className,
        )}
      >
        {children}
      </HeadlessTabList>
    </div>
  );
}

interface TabProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  index?: number;
}

function Tab({ className, children, disabled }: TabProps) {
  return (
    <HeadlessTab
      disabled={disabled}
      className={({ selected }) => cn(
        'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md w-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-pointer',
        selected 
          ? 'bg-background text-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </HeadlessTab>
  );
}

interface TabPanelsProps {
  children: React.ReactNode;
  className?: string;
}

function TabPanels({ className, children }: TabPanelsProps) {
  return (
    <HeadlessTabPanels className={cn('w-full', className)}>
      {children}
    </HeadlessTabPanels>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

function TabPanel({ className, children }: TabPanelProps) {
  return (
    <HeadlessTabPanel
      as={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn('flex-1 outline-none', className)}
    >
      {children}
    </HeadlessTabPanel>
  );
}

export {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  type TabGroupProps,
  type TabListProps,
  type TabProps,
  type TabPanelsProps,
  type TabPanelProps,
};
