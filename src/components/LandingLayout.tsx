import { Palette, Github, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GitHubUser } from "@/lib/github-auth";

declare const __APP_VERSION__: string;

interface LandingLayoutProps {
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function LandingLayout({ user, onLogin, onLogout, children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Background dot pattern */}
      <div
        className="fixed inset-0 -z-20 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-tr from-[#fddede] to-[#c83f49] rounded-full blur-3xl -z-10 opacity-30 dark:opacity-15 animate-blob" />
      <div className="fixed bottom-[-10%] left-[-5%] w-80 h-80 bg-gradient-to-tr from-[#e3e3fd] to-[#6a6af4] rounded-full blur-3xl -z-10 opacity-30 dark:opacity-15 animate-blob animation-delay-2000" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center size-8 rounded-xl bg-foreground shadow-lg">
              <Palette className="size-5 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter">La Boite à Pictos</span>
          </a>
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="rounded-full text-xs">
                  {(user.name || user.login).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {user.name || user.login}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 rounded bg-foreground text-background text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Github className="size-4" />
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex items-center justify-center size-8 rounded-xl bg-foreground shadow-lg">
              <Palette className="size-5 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter">La Boite à Pictos</span>
          </div>
          <nav aria-label="Liens du pied de page" className="flex items-center gap-4 flex-wrap">
            <a href="/discover" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Découvrir</a>
            <a href="/gallery" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Galerie</a>
            <a href="/feedback" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Feedback</a>
            <a href="/guides" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Guides</a>
            <a href="/confidentialite" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Confidentialité</a>
            <a href="/cookies" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cookies</a>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 select-none">
              v{__APP_VERSION__}
            </span>
            <a
              href="https://github.com/BarthGve/galerie-picto"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Voir le code source"
            >
              <Github className="w-4 h-4" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
