"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DayFollowUpPanel } from "@/modules/day-follow-up/components/day-follow-up-panel";
import { NotebookDayPicker } from "@/modules/journal/components/notebook-day-picker";
import { mergeJournalDayDraft } from "@/modules/journal/lib/journal-day-draft";
import { NotePreview } from "@/modules/journal/lib/note-preview";
import type { NoteDto } from "@/modules/journal/lib/domain";
import { ptBR as copy } from "@/modules/messages";
import {
  isValidNotebookDay,
  notebookDayToDate,
  shiftNotebookDay,
  todayLocalDateString,
  type JournalEditorMode
} from "@/modules/journal/lib/notebook-day";

const AUTOSAVE_DEBOUNCE_MS = 500;

async function readActiveNote(notebookDay: string): Promise<NoteDto | null> {
  const response = await fetch(
    `/api/journal/notes?notebookDay=${encodeURIComponent(notebookDay)}`
  );
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { note: NoteDto | null };
  return payload.note;
}

async function saveBodyOntoActiveNote(
  notebookDay: string,
  localBody: string
): Promise<NoteDto | null> {
  const existing = await readActiveNote(notebookDay);
  if (!existing) {
    return null;
  }

  const merged = mergeJournalDayDraft(existing.body, localBody);
  if (merged === existing.body) {
    return existing;
  }

  const response = await fetch(`/api/journal/notes/${existing.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: merged })
  });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as NoteDto;
}

type FieldErrors = Record<string, string>;

type DayDraftPayload = {
  status?: string;
  draft?: string;
  message?: string;
};

function GenerateDayDraftButton({
  pending,
  disabled,
  onClick
}: {
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={onClick}
      disabled={disabled || pending}
      aria-label={
        pending ? copy.journalDayDraft.pendingAriaLabel : copy.journalDayDraft.actionAriaLabel
      }
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-3.5" aria-hidden />
      )}
      {pending ? copy.journalDayDraft.pending : copy.journalDayDraft.action}
    </Button>
  );
}

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

function initialNotebookDayFromSearch(dayParam: string | null): string {
  if (dayParam && isValidNotebookDay(dayParam)) {
    return dayParam;
  }
  return todayLocalDateString();
}

export function JournalPage() {
  const searchParams = useSearchParams();
  const [notebookDay, setNotebookDay] = useState(() =>
    initialNotebookDayFromSearch(searchParams?.get("day") ?? null)
  );
  const [note, setNote] = useState<NoteDto | null>(null);
  const [body, setBody] = useState("");
  const [lastSavedBody, setLastSavedBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [editorMode, setEditorMode] = useState<JournalEditorMode>("edit");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const saveGenerationRef = useRef(0);
  const saveTailRef = useRef<Promise<void>>(Promise.resolve());
  const noteBodyRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef(note);
  const notebookDayRef = useRef(notebookDay);
  const bodyRef = useRef(body);

  noteRef.current = note;
  notebookDayRef.current = notebookDay;
  bodyRef.current = body;

  const loadNote = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(
      `/api/journal/notes?notebookDay=${encodeURIComponent(notebookDay)}`
    );
    if (signal?.aborted) {
      return null;
    }
    if (!response.ok) {
      throw new Error("Falha ao carregar Note.");
    }
    const payload = (await response.json()) as { note: NoteDto | null };
    if (signal?.aborted) {
      return null;
    }
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

    loadNote(controller.signal)
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

    if (body === lastSavedBody) {
      return;
    }

    if (body.trim().length === 0) {
      return;
    }

    const content = body;
    const savedForDay = notebookDay;
    const timer = window.setTimeout(() => {
      const job = saveTailRef.current.then(async () => {
        if (content.trim().length === 0 || notebookDayRef.current !== savedForDay) {
          return;
        }

        const currentNote = noteRef.current;
        const currentNotebookDay = savedForDay;

        setFieldErrors({});
        const generation = ++saveGenerationRef.current;
        setIsSaving(true);

        try {
          const response = currentNote
            ? await fetch(`/api/journal/notes/${currentNote.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: content })
            })
            : await fetch("/api/journal/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notebookDay: currentNotebookDay, body: content })
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
            const localBody = bodyRef.current;
            const saved = await saveBodyOntoActiveNote(currentNotebookDay, localBody);
            if (generation !== saveGenerationRef.current) {
              return;
            }
            if (!saved) {
              toast.error(payload.error);
              return;
            }
            noteRef.current = saved;
            setNote(saved);
            if (bodyRef.current === localBody) {
              setBody(saved.body);
              setLastSavedBody(saved.body);
            }
            return;
          }

          if (!response.ok) {
            toast.error("Não foi possível salvar a Note.");
            return;
          }

          const saved = (await response.json()) as NoteDto;

          noteRef.current = saved;

          if (content !== bodyRef.current) {
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
      });
      saveTailRef.current = job.then(
        () => undefined,
        () => undefined
      );
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

  async function generateDayDraft() {
    const requestedDay = notebookDayRef.current;
    setIsGeneratingDraft(true);
    try {
      const response = await fetch("/api/journal/day-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay: requestedDay })
      });
      const payload = (await response.json()) as DayDraftPayload;
      if (notebookDayRef.current !== requestedDay) {
        return;
      }
      if (!response.ok || payload.status !== "ok" || !payload.draft) {
        toast.error(payload.message ?? copy.journalDayDraft.failed);
        return;
      }

      let baseBody = bodyRef.current;
      if (!noteRef.current) {
        const existing = await readActiveNote(requestedDay);
        if (notebookDayRef.current !== requestedDay) {
          return;
        }
        if (existing) {
          noteRef.current = existing;
          setNote(existing);
          baseBody = mergeJournalDayDraft(existing.body, bodyRef.current);
        }
      }

      setBody(mergeJournalDayDraft(baseBody, payload.draft));
      setIsEditorOpen(true);
      setEditorMode("edit");
      window.requestAnimationFrame(() => {
        noteBodyRef.current?.focus();
      });
    } catch {
      if (notebookDayRef.current === requestedDay) {
        toast.error(copy.journalDayDraft.failed);
      }
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  const hasPendingSave =
    !isLoading && body.trim().length > 0 && body !== lastSavedBody;
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
      <div className="space-y-5">
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
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" size="sm" onClick={openEditor}>
              Criar nota
            </Button>
            <GenerateDayDraftButton
              pending={isGeneratingDraft}
              disabled={false}
              onClick={() => void generateDayDraft()}
            />
          </div>
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

            <div className="flex flex-wrap items-center gap-2">
              <GenerateDayDraftButton
                pending={isGeneratingDraft}
                disabled={isLoading}
                onClick={() => void generateDayDraft()}
              />
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
      <DayFollowUpPanel notebookDay={notebookDay} />
      </div>
    </div>
  );
}
