"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Surface } from "@/components/ui/surface";
import { useAppNotifications } from "@/modules/notifications/hooks/use-app-notifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationAlertType,
  type NotificationPreferences
} from "@/modules/notifications/lib/notification-preferences";

const ALERT_LABELS: Record<NotificationAlertType, string> = {
  prStatusChanged: "Status da minha PR mudou",
  reviewerQueueNew: "Nova PR na fila de revisão",
  prApproved: "PR aprovada",
  prChangesRequested: "Alterações solicitadas",
  prStale: "PR parada há muitos dias"
};

type NotificationPreferencesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationPreferencesDialog({
  open,
  onOpenChange
}: NotificationPreferencesDialogProps) {
  const { permission, requestPermission } = useAppNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setPreferences(loadNotificationPreferences());
  }, [open]);

  const toggleAlert = useCallback((alertType: NotificationAlertType) => {
    setPreferences((current) => ({
      ...current,
      alerts: {
        ...current.alerts,
        [alertType]: !current.alerts[alertType]
      }
    }));
  }, []);

  const save = useCallback(() => {
    saveNotificationPreferences(preferences);
    onOpenChange(false);
  }, [onOpenChange, preferences]);

  const permissionHint =
    permission === "granted"
      ? "Notificações do navegador ativas."
      : permission === "denied"
        ? "Permissão negada — alertas aparecem como toast."
        : "Permita notificações para alertas com o app em segundo plano.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alertas configuráveis</DialogTitle>
          <DialogDescription>{permissionHint}</DialogDescription>
        </DialogHeader>

        <Surface className="flex flex-col gap-3 p-4">
          {(Object.keys(ALERT_LABELS) as NotificationAlertType[]).map((alertType) => (
            <label
              key={alertType}
              className="flex cursor-pointer items-start gap-3 text-sm text-[var(--app-text)]"
            >
              <input
                type="checkbox"
                checked={preferences.alerts[alertType]}
                onChange={() => toggleAlert(alertType)}
                className="mt-0.5 size-4 accent-[var(--brand)]"
              />
              <span>{ALERT_LABELS[alertType]}</span>
            </label>
          ))}

          {preferences.alerts.prStale && (
            <label className="flex items-center gap-3 text-sm text-[var(--app-text-muted)]">
              <span className="shrink-0">Dias sem movimento</span>
              <input
                type="number"
                min={1}
                max={30}
                value={preferences.staleDaysThreshold}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (Number.isNaN(value) || value < 1) {
                    return;
                  }
                  setPreferences((current) => ({ ...current, staleDaysThreshold: value }));
                }}
                className="w-16 rounded-md border border-[var(--app-border)] bg-transparent px-2 py-1"
              />
            </label>
          )}
        </Surface>

        <DialogFooter className="gap-2 sm:justify-between">
          {permission !== "granted" && permission !== "denied" ? (
            <Button type="button" variant="outline" onClick={() => void requestPermission()}>
              Permitir notificações
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={save}>
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotificationPreferencesTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2 px-2 text-xs text-[var(--app-text-muted)] group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
        onClick={() => setOpen(true)}
        aria-label="Configurar alertas"
      >
        <Bell className="size-3.5 shrink-0" aria-hidden />
        <span className="group-data-[collapsible=icon]:hidden">Alertas</span>
      </Button>
      <NotificationPreferencesDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
