import { ArrowRight, Search } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

interface NotFoundPageProps {
  onGoHome: () => void;
  onGoGallery: () => void;
}

export function NotFoundPage({ onGoHome, onGoGallery }: NotFoundPageProps) {
  return (
    <>
      <SEOHead title="Page introuvable" description="La page que vous recherchez n'existe pas." path="/404" />
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-md space-y-6">
          <p className="text-8xl font-black text-muted-foreground/20">404</p>
          <h1 className="text-2xl font-extrabold text-foreground">
            Page introuvable
          </h1>
          <p className="text-muted-foreground">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={onGoHome}
              className="px-6 py-3 rounded font-bold bg-primary text-primary-foreground hover:bg-(--primary-hover) transition-all"
            >
              <span className="flex items-center gap-2 justify-center">
                Retour à l'accueil
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={onGoGallery}
              className="px-6 py-3 rounded font-bold border-2 border-border text-foreground hover:bg-muted transition-all"
            >
              <span className="flex items-center gap-2 justify-center">
                <Search className="w-4 h-4" />
                Explorer la galerie
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
