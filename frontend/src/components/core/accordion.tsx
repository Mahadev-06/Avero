'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import {
  motion,
  AnimatePresence,
  Transition,
  Variant,
  Variants,
} from 'motion/react';
import { cn } from '@/lib/utils';

type AccordionContextType = {
  expandedValue: string | null;
  toggleItem: (value: string) => void;
  variants?: {
    expanded: Variant;
    collapsed: Variant;
  };
  transition?: Transition;
};

const AccordionContext = createContext<AccordionContextType | undefined>(
  undefined
);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion');
  }
  return context;
}

type AccordionItemContextType = {
  value: string;
  isExpanded: boolean;
};

const AccordionItemContext = createContext<
  AccordionItemContextType | undefined
>(undefined);

function useAccordionItem() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('useAccordionItem must be used within an AccordionItem');
  }
  return context;
}

type AccordionProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  transition?: Transition;
  variants?: {
    expanded: Variant;
    collapsed: Variant;
  };
  defaultValue?: string | null;
};

export function Accordion({
  children,
  className,
  style,
  transition = { type: 'spring', stiffness: 120, damping: 20 },
  variants,
  defaultValue = null,
}: AccordionProps) {
  const [expandedValue, setExpandedValue] = useState<string | null>(defaultValue);

  const toggleItem = (value: string) => {
    setExpandedValue((prev) => (prev === value ? null : value));
  };

  return (
    <AccordionContext.Provider
      value={{
        expandedValue,
        toggleItem,
        variants,
        transition,
      }}
    >
      <div
        className={cn('flex w-full flex-col', className)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          width: '100%',
          ...style,
        }}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function AccordionItem({
  value,
  children,
  className,
  style,
}: AccordionItemProps) {
  const { expandedValue } = useAccordion();
  const isExpanded = expandedValue === value;

  return (
    <AccordionItemContext.Provider value={{ value, isExpanded }}>
      <div
        data-expanded={isExpanded ? '' : undefined}
        data-state={isExpanded ? 'expanded' : 'collapsed'}
        className={cn('group', className)}
        style={style}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

type AccordionTriggerProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
};

export function AccordionTrigger({
  children,
  className,
  style,
  onClick,
}: AccordionTriggerProps) {
  const { toggleItem } = useAccordion();
  const { value, isExpanded } = useAccordionItem();

  return (
    <button
      type="button"
      aria-expanded={isExpanded}
      data-expanded={isExpanded ? '' : undefined}
      data-state={isExpanded ? 'expanded' : 'collapsed'}
      onClick={() => {
        toggleItem(value);
        onClick?.();
      }}
      className={cn(
        'group flex w-full cursor-pointer items-center justify-between text-left transition-all outline-none',
        className
      )}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        border: 'none',
        background: 'transparent',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

type AccordionContentProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function AccordionContent({
  children,
  className,
  style,
}: AccordionContentProps) {
  const { isExpanded } = useAccordionItem();
  const { variants, transition } = useAccordion();

  const defaultVariants: Variants = {
    expanded: {
      opacity: 1,
      height: 'auto',
      scale: 1,
    },
    collapsed: {
      opacity: 0,
      height: 0,
      scale: 0.95,
    },
  };

  const activeVariants = variants
    ? {
        expanded: {
          height: 'auto',
          ...variants.expanded,
        },
        collapsed: {
          height: 0,
          ...variants.collapsed,
        },
      }
    : defaultVariants;

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={activeVariants}
          transition={transition}
          className={cn('overflow-hidden', className)}
          style={{
            overflow: 'hidden',
            ...style,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
