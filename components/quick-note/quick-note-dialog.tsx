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
        destination: "journal" | "task";
        routedBy: "ai" | "fallback";
      };

      if (payload.destination === "task") {
        toast.success("Salvo como tarefa.");
        dispatchTasksUpdated();
      } else if (payload.routedBy === "fallback") {
        toast.success("Salvo no caderno de hoje (IA indisponível).");
      } else {
        toast.success("Salvo no caderno de hoje.");
      }

      setText("");
      setIsOpen(false);
    } catch {
      toast.error("Não foi possível salvar a quick note.");
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
          <DialogTitle>Quick note</DialogTitle>
          <DialogDescription>
            A IA decide se vira tarefa ou nota no caderno de hoje. Ctrl+Enter para salvar.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Digite sua nota rápida..."
          aria-label="Texto da quick note"
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
