import { Palette, LogIn, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GitHubUser } from "@/lib/github-auth";

interface NavbarProps {
  user: GitHubUser | null;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onUploadClick: () => void;
}

export function Navbar({
  user,
  isAuthenticated,
  onLogin,
  onLogout,
  onUploadClick,
}: NavbarProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Galerie Pictogrammes</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button size="sm" onClick={onUploadClick}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un pictogramme
            </Button>
          )}

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.login}
                    className="h-7 w-7 rounded-full"
                  />
                  <span className="hidden sm:inline text-sm">
                    {user.name || user.login}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled
                  className="text-xs text-muted-foreground"
                >
                  {user.login}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={onLogin}>
              <LogIn className="h-4 w-4 mr-1" />
              Connexion GitHub
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
