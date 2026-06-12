"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function dateOnlyToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecionar data",
  disabled,
  className,
  "aria-invalid": ariaInvalid
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value.length > 0 ? dateOnlyToDate(value) : undefined;

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              className={cn("min-w-0 flex-1 justify-between font-normal", value.length === 0 && "text-muted-foreground")}
            />
          }
        >
          {selected ? format(selected, "PPP", { locale: ptBR }) : placeholder}
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) {
                return;
              }
              onChange(dateToDateOnly(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Limpar data"
          onClick={() => onChange("")}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
