"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NotebookDayPicker } from "@/modules/journal/components/notebook-day-picker";
import { NotePreview } from "@/modules/journal/lib/note-preview";
import type { NoteDto } from "@/modules/journal/lib/domain";
import {
  notebookDayToDate,
  shiftNotebookDay,
  todayLocalDateString,
  type JournalEditorMode
} from "@/modules/journal/lib/notebook-day";

const AUTOSAVE_DEBOUNCE_MS = 500;

type FieldErrors = Record<string, string>;

function JournalLoadingSkeleton() {
  return (
    <Surface aria-hidden className="space-y-4 p-4 md:p-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="min-h-[16rem] w-full rounded-lg" />
    </Surface>
  );
}

function dayHeadingLabel(notebookDay: string, today: string): string {
  if (notebookDay === today) {
    return "Hoje";
  }
  const date = notebookDayToDate(notebookDay);
  if (isToday(date)) {
    return "Hoje";
  }
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function JournalPage() {
  const [notebookDay, setNotebookDay] = useState(() => todayLocalDateString());
  const [note, setNote] = useState<NoteDto | null>(null);
  const [body, setBody] = useState("");
  const [lastSavedBody, setLastSavedBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<JournalEditorMode>("edit");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const saveGenerationRef = useRef(0);
  const noteBodyRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef(note);
  const notebookDayRef = useRef(notebookDay);
  const bodyRef = useRef(body);

  noteRef.current = note;
  notebookDayRef.current = notebookDay;
  bodyRef.current = body;

  const loadNote = useCallback(async () => {
    const response = await fetch(
      `/api/journal/notes?notebookDay=${encodeURIComponent(notebookDay)}`
    );
    if (!response.ok) {
      throw new Error("Falha ao carregar Note.");
    }
    const payload = (await response.json()) as { note: NoteDto | null };
    const loadedBody = payload.note?.body ?? "";
    setNote(payload.note);
    setBody(loadedBody);
    setLastSavedBody(loadedBody);
    setIsEditorOpen(payload.note !== null);
    setEditorMode(notebookDay === todayLocalDateString() ? "edit" : "preview");
    return payload.note;
  }, [notebookDay]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setFieldErrors({});

    loadNote()
      .catch(() => toast.error("Não foi possível carregar a Note deste Notebook day."))
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [loadNote]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (body.trim() === lastSavedBody.trim()) {
      return;
    }

    if (body.trim().length === 0) {
      return;
    }

    const content = body;
    const timer = window.setTimeout(() => {
      void (async () => {
        const trimmed = content.trim();
        if (trimmed.length === 0) {
          return;
        }

        const currentNote = noteRef.current;
        const currentNotebookDay = notebookDayRef.current;

        setFieldErrors({});
        const generation = ++saveGenerationRef.current;
        setIsSaving(true);

        try {
          const response = currentNote
            ? await fetch(`/api/journal/notes/${currentNote.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: trimmed })
            })
            : await fetch("/api/journal/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notebookDay: currentNotebookDay, body: trimmed })
            });

          if (generation !== saveGenerationRef.current) {
            return;
          }

          if (response.status === 400) {
            const payload = (await response.json()) as { errors: FieldErrors };
            setFieldErrors(payload.errors);
            return;
          }

          if (response.status === 409) {
            const payload = (await response.json()) as { error: string };
            toast.error(payload.error);
            return;
          }

          if (!response.ok) {
            toast.error("Não foi possível salvar a Note.");
            return;
          }

          const saved = (await response.json()) as NoteDto;

          if (content.trim() !== bodyRef.current.trim()) {
            if (!currentNote) {
              setNote(saved);
            }
            return;
          }

          setNote(saved);
          setBody(saved.body);
          setLastSavedBody(saved.body);
        } catch {
          if (generation === saveGenerationRef.current) {
            toast.error("Não foi possível salvar a Note.");
          }
        } finally {
          if (generation === saveGenerationRef.current) {
            setIsSaving(false);
          }
        }
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [body, isLoading, lastSavedBody]);

  function navigateToDay(nextDay: string) {
    saveGenerationRef.current += 1;
    setNotebookDay(nextDay);
  }

  function openEditor() {
    setIsEditorOpen(true);
    setEditorMode("edit");
    window.requestAnimationFrame(() => {
      noteBodyRef.current?.focus();
    });
  }

  const hasPendingSave =
    !isLoading && body.trim().length > 0 && body.trim() !== lastSavedBody.trim();
  const isSaveInProgress = hasPendingSave || isSaving;
  const showSavedIndicator = !isLoading && !isSaveInProgress && lastSavedBody.trim().length > 0;
  const showEditor = !isLoading && (note !== null || isEditorOpen);
  const isEmptyNotebook = !isLoading && note === null && !isEditorOpen;
  const isTodayDay = notebookDay === todayLocalDateString();

  return (
    <div className="journal-page space-y-5">
      <Surface variant="inset" className="journal-nav p-3 md:p-4">
        <nav
          aria-label="Navegação do caderno"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => navigateToDay(shiftNotebookDay(notebookDay, -1))}
              disabled={isLoading}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <NotebookDayPicker
              id="notebook-day"
              value={notebookDay}
              onChange={navigateToDay}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => navigateToDay(shiftNotebookDay(notebookDay, 1))}
              disabled={isLoading}
              aria-label="Próximo dia"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant={isTodayDay ? "secondary" : "outline"}
              size="sm"
              onClick={() => navigateToDay(todayLocalDateString())}
              disabled={isLoading || isTodayDay}
              className={cn(isTodayDay && "pointer-events-none")}
            >
              Hoje
            </Button>
          </div>

          <div className="min-w-0 sm:text-right">
            <p className="truncate text-sm font-medium capitalize text-[var(--app-text)]">
              {dayHeadingLabel(notebookDay, todayLocalDateString())}
            </p>
            <p className="text-xs text-[var(--app-text-muted)]">
              {isTodayDay
                ? "Modo edição ao abrir"
                : "Modo leitura ao abrir — use Editar para alterar"}
            </p>
          </div>
        </nav>
      </Surface>

      {isLoading ? <JournalLoadingSkeleton /> : null}

      {isEmptyNotebook ? (
        <Surface
          as="div"
          role="status"
          aria-label="Caderno vazio"
          variant="dashed"
          className="journal-empty flex flex-col items-center px-6 py-10 text-center"
        >
          <span
            className="mb-4 flex size-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-dim)] text-[var(--brand-bright)]"
            aria-hidden
          >
            <BookOpen className="size-6" />
          </span>
          <p className="text-base font-medium text-[var(--app-text)]">Caderno vazio</p>
          <p className="mt-1 max-w-sm text-sm text-[var(--app-text-muted)]">
            Nenhuma nota neste dia. Comece um registro em Markdown — standup, decisões ou
            aprendizados do dia.
          </p>
          <Button type="button" size="sm" className="mt-5" onClick={openEditor}>
            Criar nota
          </Button>
        </Surface>
      ) : null}

      {showEditor ? (
        <Surface aria-label="Editor de nota" className="journal-editor space-y-4 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] pb-3">
            <div
              className="journal-mode-toggle inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-inset)] p-0.5"
              role="group"
              aria-label="Modo do editor"
            >
              <Button
                type="button"
                variant={editorMode === "edit" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 rounded-md"
                onClick={() => setEditorMode("edit")}
                disabled={isLoading}
              >
                <Pencil className="size-3.5" aria-hidden />
                Editar
              </Button>
              <Button
                type="button"
                variant={editorMode === "preview" ? "default" : "ghost"}
                size="sm"
                className="gap-1.5 rounded-md"
                onClick={() => setEditorMode("preview")}
                disabled={isLoading}
              >
                <Eye className="size-3.5" aria-hidden />
                Preview
              </Button>
            </div>

            {editorMode === "edit" ? (
              isSaveInProgress ? (
                <span
                  role="status"
                  aria-live="polite"
                  aria-label="Salvando"
                  className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]"
                >
                  <Loader2 className="size-3.5 shrink-0 animate-spin text-[var(--brand)]" aria-hidden />
                  Salvando…
                </span>
              ) : showSavedIndicator ? (
                <span
                  role="status"
                  aria-live="polite"
                  aria-label="Salvo"
                  className="flex items-center gap-1.5 text-xs text-[var(--app-text-muted)]"
                >
                  <Check className="size-3.5 shrink-0 text-[var(--brand-bright)]" aria-hidden />
                  Salvo
                </span>
              ) : null
            ) : (
              <span className="text-xs text-[var(--app-text-muted)]">Somente leitura</span>
            )}
          </div>

          {editorMode === "edit" ? (
            <div className="space-y-2">
              <label
                htmlFor="note-body"
                className="text-sm font-medium text-[var(--app-text)]"
              >
                Corpo da nota
              </label>
              <Textarea
                ref={noteBodyRef}
                id="note-body"
                name="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={16}
                placeholder="Markdown da nota…"
                className="journal-textarea min-h-[16rem] font-mono text-sm"
                disabled={isLoading}
              />
              {fieldErrors.body ? (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.body}
                </p>
              ) : null}
            </div>
          ) : (
            <NotePreview markdown={body} />
          )}
        </Surface>
      ) : null}
    </div>
  );
}
