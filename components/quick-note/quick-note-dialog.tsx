"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { isQuickNoteOpenShortcut } from "@/modules/journal/lib/quick-note";
import { ptBR } from "@/modules/messages/pt-BR";
import { dispatchTasksUpdated } from "@/modules/tasks/lib/task-events";

type FieldErrors = Record<string, string>;

export function QuickNoteDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isQuickNoteOpenShortcut(event)) {
        return;
      }

      event.preventDefault();
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = useCallback(async () => {
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/journal/quick-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (response.status === 400) {
        const payload = (await response.json()) as { errors: FieldErrors };
        setFieldErrors(payload.errors);
        return;
      }

      if (!response.ok) {
        throw new Error("Falha ao salvar quick note.");
      }

      const payload = (await response.json()) as {
        routedBy: "ai" | "fallback";
        tasks: unknown[];
      };

      if (payload.tasks.length > 0) {
        toast.success(ptBR.quickNote.savedWithTasks(payload.tasks.length));
        dispatchTasksUpdated();
      } else if (payload.routedBy === "fallback") {
        toast.success(ptBR.quickNote.savedJournalFallback);
      } else {
        toast.success(ptBR.quickNote.savedJournal);
      }

      setText("");
      setIsOpen(false);
    } catch {
      toast.error(ptBR.quickNote.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }, [text]);

  const handleTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey) || isSubmitting) {
        return;
      }

      event.preventDefault();
      void handleSubmit();
    },
    [handleSubmit, isSubmitting]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setFieldErrors({});
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ptBR.quickNote.title}</DialogTitle>
          <DialogDescription>{ptBR.quickNote.description}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder={ptBR.quickNote.placeholder}
          aria-label={ptBR.quickNote.textAriaLabel}
          aria-invalid={Boolean(fieldErrors.text)}
          rows={4}
          autoFocus
          disabled={isSubmitting}
        />
        {fieldErrors.text ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors.text}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
