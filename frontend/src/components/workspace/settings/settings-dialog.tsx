"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppearanceSettingsPage } from "@/components/workspace/settings/appearance-settings-page";
import { useI18n } from "@/core/i18n/hooks";

type SettingsDialogProps = React.ComponentProps<typeof Dialog>;

export function SettingsDialog(props: SettingsDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog
      {...props}
      onOpenChange={(open) => props.onOpenChange?.(open)}
    >
      <DialogContent
        className="sm:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="gap-1">
          <DialogTitle>{t.settings.title}</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {t.settings.description}
          </p>
        </DialogHeader>
        <AppearanceSettingsPage />
      </DialogContent>
    </Dialog>
  );
}
