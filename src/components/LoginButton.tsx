import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  initiateGitHubLogin,
  handleGitHubCallback,
  getGitHubUser,
  logout,
  getStoredToken,
  type GitHubUser,
} from "@/lib/github-auth";

export function LoginButton() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Vérifier s'il y a un code OAuth dans l'URL
      const params = new URLSearchParams(window.location.search);
      if (params.has("code")) {
        const token = await handleGitHubCallback();
        if (token) {
          const userInfo = await getGitHubUser(token);
          setUser(userInfo);
        }
      } else {
        // Vérifier si on a déjà un token
        const token = getStoredToken();
        if (token) {
          const userInfo = await getGitHubUser(token);
          setUser(userInfo);
        }
      }
      setLoading(false);
    }

    init();
  }, []);

  if (loading) {
    return (
      <Button variant="outline" disabled>
        <User className="h-4 w-4 mr-2" />
        Chargement...
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <img
            src={user.avatar_url}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
          <span className="hidden sm:inline">{user.name || user.login}</span>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={initiateGitHubLogin}>
      <LogIn className="h-4 w-4 mr-2" />
      Login with GitHub
    </Button>
  );
}
