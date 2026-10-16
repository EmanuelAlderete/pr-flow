"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { NotePreview } from "@/modules/journal/lib/note-preview";
import { ptBR } from "@/modules/messages";
import type { StandupScriptContent } from "@/modules/day-follow-up/lib/subsidy";

type ScriptStatus = "draft" | "used";

type FollowUpPayload = {
  notebookDay: string;
  windowOpen: boolean;
  script: { content: StandupScriptContent; status: ScriptStatus } | null;
  summary: { content: string; generatedAt: string } | null;
};

type QuizQuestion = {
  kind: "gap" | "mentoring";
  beat: "yesterday" | "today" | "blocker" | null;
  question: string;
};

type DayFollowUpPanelProps = {
  notebookDay: string;
};

function beatLabel(beat: "yesterday" | "today" | "blocker"): string {
  if (beat === "yesterday") {
    return ptBR.followUp.yesterday;
  }
  if (beat === "today") {
    return ptBR.followUp.today;
  }
  return ptBR.followUp.blocker;
}

export function DayFollowUpPanel({ notebookDay }: DayFollowUpPanelProps) {
  const [followUp, setFollowUp] = useState<FollowUpPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [quizNotice, setQuizNotice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/journal/follow-up?notebookDay=${encodeURIComponent(notebookDay)}`
    );
    if (!response.ok) {
      throw new Error(ptBR.followUp.loadFailed);
    }
    const payload = (await response.json()) as FollowUpPayload;
    setFollowUp(payload);
    setError(null);
  }, [notebookDay]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setQuestion(null);
    setQuizNotice(null);
    setAnswer("");

    load()
      .catch(() => setError(ptBR.followUp.loadFailed))
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [load]);

  async function markUsed() {
    setIsBusy(true);
    try {
      const response = await fetch("/api/journal/follow-up/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay })
      });
      if (!response.ok) {
        setError(ptBR.followUp.saveFailed);
        return;
      }
      await load();
    } catch {
      setError(ptBR.followUp.saveFailed);
    } finally {
      setIsBusy(false);
    }
  }

  async function askNext() {
    setIsBusy(true);
    setQuizNotice(null);
    try {
      const response = await fetch("/api/journal/follow-up/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookDay })
      });
      if (!response.ok) {
        setError(ptBR.followUp.saveFailed);
        return;
      }
      const payload = (await response.json()) as
        | ({ status: "question" } & QuizQuestion)
        | { status: "none"; message: string };
      if (payload.status === "none") {
        setQuestion(null);
        setQuizNotice(payload.message);
        return;
      }
      setQuestion({ kind: payload.kind, beat: payload.beat, question: payload.question });
    } catch {
      setError(ptBR.followUp.saveFailed);
    } finally {
      setIsBusy(false);
    }
  }

  async function sendAnswer() {
    if (!question || answer.trim().length === 0) {
      return;
    }
    setIsBusy(true);
    try {
      const response = await fetch("/api/journal/follow-up/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookDay,
          kind: question.kind,
          beat: question.beat,
          question: question.question,
          answer
        })
      });
      const payload = (await response.json()) as { status: string; message?: string };
      if (payload.status === "window_closed") {
        setQuizNotice(payload.message ?? ptBR.followUp.answerRejected);
        setQuestion(null);
        await load();
        return;
      }
      if (!response.ok || payload.status !== "saved") {
        setQuizNotice(payload.message ?? ptBR.followUp.noNextQuestion);
        return;
      }
      setQuestion(null);
      setAnswer("");
      setQuizNotice(null);
      await load();
    } catch {
      setError(ptBR.followUp.saveFailed);
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <Surface aria-hidden className="space-y-3 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </Surface>
    );
  }

  const script = followUp?.script ?? null;
  const windowOpen = followUp?.windowOpen ?? false;

  return (
    <Surface aria-label={ptBR.followUp.panelTitle} className="space-y-5 p-4 md:p-5">
      <h2 className="text-sm font-medium text-[var(--app-text)]">{ptBR.followUp.panelTitle}</h2>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {followUp ? (
        <>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--app-text)]">{ptBR.followUp.scriptTitle}</h3>
        {script ? (
          <div className="space-y-3 text-sm text-[var(--app-text-soft)]">
            {(["yesterday", "today", "blocker"] as const).map((beat) => (
              <div key={beat}>
                <p className="text-xs font-medium text-[var(--app-text)]">{beatLabel(beat)}</p>
                <p className="whitespace-pre-wrap">{script.content[beat]}</p>
              </div>
            ))}
            {script.status === "draft" ? (
              <p className="text-xs text-[var(--app-text-muted)]">{ptBR.followUp.draftHint}</p>
            ) : (
              <p className="text-xs text-[var(--app-text-muted)]">{ptBR.followUp.scriptUsed}</p>
            )}
            {script.status === "draft" ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void markUsed()} disabled={isBusy}>
                {ptBR.followUp.markUsed}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{ptBR.followUp.windowClosed}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--app-text)]">{ptBR.followUp.summaryTitle}</h3>
        {followUp.summary ? (
          <NotePreview markdown={followUp.summary.content} />
        ) : (
          <p className="text-sm text-[var(--app-text-muted)]">{ptBR.followUp.noSummaryYet}</p>
        )}
        {windowOpen ? null : (
          <p className="text-xs text-[var(--app-text-muted)]">{ptBR.followUp.windowClosed}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--app-text)]">{ptBR.followUp.quizTitle}</h3>
        {question ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--app-text-muted)]">
              {question.kind === "gap" ? ptBR.followUp.gapLabel : ptBR.followUp.mentoringLabel}
            </p>
            <p className="text-sm text-[var(--app-text)]">{question.question}</p>
            <label htmlFor="quiz-answer" className="text-sm font-medium text-[var(--app-text)]">
              {ptBR.followUp.answerLabel}
            </label>
            <Textarea
              id="quiz-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={4}
              disabled={isBusy || !windowOpen}
            />
            <Button type="button" size="sm" onClick={() => void sendAnswer()} disabled={isBusy || !windowOpen}>
              {ptBR.followUp.sendAnswer}
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={() => void askNext()} disabled={isBusy || !windowOpen}>
            {ptBR.followUp.nextQuestion}
          </Button>
        )}
        {quizNotice ? (
          <p className="text-sm text-[var(--app-text-muted)]" role="status">
            {quizNotice}
          </p>
        ) : null}
      </div>
        </>
      ) : null}
    </Surface>
  );
}
