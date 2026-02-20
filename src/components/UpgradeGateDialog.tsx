import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import {
  Download,
  Palette,
  Heart,
  Shield,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Github,
} from "lucide-react";

interface UpgradeGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

const features = [
  { icon: Download, label: "Téléchargements\nillimités", sub: "SVG + PNG" },
  { icon: Palette, label: "Couleurs\npersonnalisées", sub: "Tout format" },
  { icon: Heart, label: "Favoris\n& collections", sub: "Synchronisés" },
  { icon: Shield, label: "Accès\ncomplet", sub: "100% gratuit" },
] as const;

export function UpgradeGateDialog({
  open,
  onOpenChange,
  onLogin,
}: UpgradeGateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="overflow-hidden border-[var(--dsfr-blue-france-925)] bg-gradient-to-b from-white to-[var(--dsfr-blue-france-975)] dark:border-white/10 dark:from-[var(--dsfr-grey-50)] dark:to-[var(--dsfr-grey-50)] p-0 shadow-2xl shadow-primary/10 sm:max-w-md sm:rounded"
      >
        <VisuallyHidden.Root asChild>
          <DialogTitle>Passez en mode illimité</DialogTitle>
        </VisuallyHidden.Root>

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[var(--dsfr-blue-france-main)]/10 dark:bg-[var(--dsfr-blue-france-main)]/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 px-8 pt-10 pb-8">
          {/* Icon badge */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded bg-primary/20 dark:bg-primary/30 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] shadow-lg shadow-primary/30">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-bold text-foreground">
            Passez en mode{" "}
            <span className="bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-main)] bg-clip-text text-transparent">
              illimité
            </span>
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Connectez-vous gratuitement pour tout débloquer
          </p>

          {/* Features grid */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="group rounded border border-border bg-black/[0.02] dark:bg-white/[0.03] p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.05]"
              >
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <p className="whitespace-pre-line text-xs font-medium leading-tight text-foreground/80">
                  {label}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              onOpenChange(false);
              onLogin();
            }}
            className="group mt-8 flex w-full items-center justify-center gap-2.5 rounded bg-gradient-to-r from-[var(--dsfr-blue-france-sun)] to-[var(--dsfr-blue-france-main)] px-6 py-3.5 font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
          >
            <Github className="h-5 w-5" />
            Continuer avec GitHub
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Pas de compte ?{" "}
            <a
              href="https://github.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-foreground/50 transition-colors hover:text-primary"
            >
              Créer un compte GitHub
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
