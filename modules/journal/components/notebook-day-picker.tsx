"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { localCalendarDateOnly, notebookDayToDate } from "@/modules/journal/lib/notebook-day";

type NotebookDayPickerProps = {
  id?: string;
  value: string;
  onChange: (notebookDay: string) => void;
  disabled?: boolean;
};

export function NotebookDayPicker({ id, value, onChange, disabled }: NotebookDayPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = notebookDayToDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            data-notebook-day={value}
            aria-label="Dia do caderno"
            className="w-[12.5rem] justify-between font-normal"
          />
        }
      >
        {format(selected, "PPP", { locale: ptBR })}
        <ChevronDownIcon className="size-4 opacity-50" />
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
            onChange(localCalendarDateOnly(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
