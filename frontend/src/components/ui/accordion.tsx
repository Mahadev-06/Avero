"use client";

import * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "bg-[var(--card-bg)] transition-colors duration-150 overflow-hidden",
        className
      )}
      style={{
        border: '1.5px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--card-bg)',
        overflow: 'hidden',
        isolation: 'isolate',
      }}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex w-full">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex w-full items-center justify-between text-left text-base font-bold transition-all outline-none cursor-pointer text-[var(--text-color)] hover:bg-[var(--bg-subtle)]",
          className
        )}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-color)',
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          textWrap: 'balance',
          borderRadius: 'inherit',
        }}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-200 ease-out text-[var(--text-color)]"
          style={{
            color: 'var(--text-color)',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className={cn("overflow-hidden text-sm text-[var(--text-muted)]", className)}
      {...props}
    >
      <div
        style={{
          padding: '0 1.25rem 1.25rem 1.25rem',
          color: 'var(--text-muted)',
          lineHeight: 1.65,
          fontSize: '0.92rem',
        }}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
