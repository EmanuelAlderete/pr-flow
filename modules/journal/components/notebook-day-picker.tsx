"use client";

import { useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  localCalendarDateOnly,
  notebookDayToDate,
  shiftNotebookDay
} from "@/modules/journal/lib/notebook-day";
import { ptBR as messages } from "@/modules/messages/pt-BR";

type NotebookDayPickerProps = {
  id?: string;
  value: string;
  onChange: (notebookDay: string) => void;
  disabled?: boolean;
};

function monthQueryRange(month: Date): { from: string; to: string } {
  const from = shiftNotebookDay(localCalendarDateOnly(startOfMonth(month)), -7);
  const to = shiftNotebookDay(localCalendarDateOnly(endOfMonth(month)), 7);
  return { from, to };
}

export function NotebookDayPicker({ id, value, onChange, disabled }: NotebookDayPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = notebookDayToDate(value);
  const [month, setMonth] = useState(selected);
  const [daysWithNote, setDaysWithNote] = useState<Date[]>([]);

  useEffect(() => {
    setMonth(notebookDayToDate(value));
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    const { from, to } = monthQueryRange(month);

    void fetch(
      `/api/journal/note-days?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { notebookDays: string[] };
        setDaysWithNote(payload.notebookDays.map((day) => notebookDayToDate(day)));
      })
      .catch(() => {
        /* ignore abort / network — markers are optional */
      });

    return () => controller.abort();
  }, [open, month]);

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
          month={month}
          onMonthChange={setMonth}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) {
              return;
            }
            onChange(localCalendarDateOnly(date));
            setOpen(false);
          }}
          modifiers={{ hasNote: daysWithNote }}
          modifiersClassNames={{
            hasNote: cn(
              "relative after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2",
              "after:rounded-full after:bg-[var(--brand-bright)] after:content-['']"
            )
          }}
          labels={{
            labelDayButton: (date, modifiers) => {
              const base = format(date, "PPP", { locale: ptBR });
              return modifiers.hasNote ? `${base} — ${messages.journalStreak.calendarHasNote}` : base;
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
