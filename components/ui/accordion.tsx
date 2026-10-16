"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("panel overflow-hidden border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left text-sm outline-none transition-colors",
          "hover:bg-[var(--app-surface-inset)] focus-visible:ring-3 focus-visible:ring-ring/50",
          "[&[data-panel-open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="mt-0.5 size-4 shrink-0 text-[var(--app-text-muted)] transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("px-4 pt-1 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
