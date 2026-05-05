import * as React from 'react';
import { motion } from 'motion/react';

// Context para manejar el estado de los tabs
interface TabContextProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const TabContext = React.createContext<TabContextProps | undefined>(undefined);

export function useTab() {
  const context = React.useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabGroup');
  }
  return context;
}

// Tipos base para props
export interface TabGroupProps<TTag extends React.ElementType = 'div'> {
  as?: TTag;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  children: React.ReactNode;
  className?: string;
}

export interface TabListProps<TTag extends React.ElementType = 'div'> {
  as?: TTag;
  children: React.ReactNode;
  className?: string;
}

export interface TabProps<TTag extends React.ElementType = 'button'> {
  as?: TTag;
  index: number;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface TabPanelsProps<TTag extends React.ElementType = typeof motion.div> {
  as?: TTag;
  children: React.ReactNode;
  className?: string;
}

export interface TabPanelProps<TTag extends React.ElementType = typeof motion.div> {
  as?: TTag;
  index?: number;
  children: React.ReactNode;
  className?: string;
}

// Primitivos base
export function TabGroup<TTag extends React.ElementType = 'div'>({
  as,
  defaultIndex = 0,
  onChange,
  children,
  className,
  ...props
}: TabGroupProps<TTag> & Omit<React.ComponentPropsWithoutRef<TTag>, keyof TabGroupProps<TTag>>) {
  const Component = as || 'div';
  const [activeIndex, setActiveIndex] = React.useState(defaultIndex);

  const handleTabChange = React.useCallback((index: number) => {
    setActiveIndex(index);
    onChange?.(index);
  }, [onChange]);

  const contextValue = React.useMemo(() => ({
    activeIndex,
    setActiveIndex: handleTabChange,
  }), [activeIndex, handleTabChange]);

  return (
    <TabContext.Provider value={contextValue}>
      <Component className={className} {...props}>
        {children}
      </Component>
    </TabContext.Provider>
  );
}

export function TabList<TTag extends React.ElementType = 'div'>({
  as,
  children,
  className,
  ...props
}: TabListProps<TTag> & Omit<React.ComponentPropsWithoutRef<TTag>, keyof TabListProps<TTag>>) {
  const Component = as || 'div';

  return (
    <Component
      role="tablist"
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Tab<TTag extends React.ElementType = 'button'>({
  as,
  index,
  children,
  className,
  disabled,
  ...props
}: TabProps<TTag> & Omit<React.ComponentPropsWithoutRef<TTag>, keyof TabProps<TTag>>) {
  const Component = as || 'button';
  const { activeIndex, setActiveIndex } = useTab();
  const isActive = activeIndex === index;

  const handleClick = () => {
    if (!disabled) {
      setActiveIndex(index);
    }
  };

  return (
    <Component
      role="tab"
      aria-selected={isActive}
      data-active={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function TabPanels<TTag extends React.ElementType = typeof motion.div>({
  as,
  children,
  className,
  ...props
}: TabPanelsProps<TTag> & Omit<React.ComponentPropsWithoutRef<TTag>, keyof TabPanelsProps<TTag>>) {
  const Component = as || motion.div;

  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export function TabPanel<TTag extends React.ElementType = typeof motion.div>({
  as,
  index,
  children,
  className,
  ...props
}: TabPanelProps<TTag> & Omit<React.ComponentPropsWithoutRef<TTag>, keyof TabPanelProps<TTag>>) {
  const Component = as || motion.div;
  const { activeIndex } = useTab();
  const isActive = index === undefined || activeIndex === index;

  if (!isActive && index !== undefined) {
    return null;
  }

  return (
    <Component
      role="tabpanel"
      className={className}
      initial={index !== undefined ? { opacity: 0, y: 10 } : undefined}
      animate={index !== undefined ? { opacity: 1, y: 0 } : undefined}
      exit={index !== undefined ? { opacity: 0, y: -10 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </Component>
  );
}

// Highlight components (para efectos visuales)
export function TabHighlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function TabHighlightItem({ 
  index, 
  children, 
  className 
}: { 
  index: number; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}