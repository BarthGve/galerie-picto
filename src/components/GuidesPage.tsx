import { BookOpen, Play } from "lucide-react";
import { useState } from "react";
import { BreadcrumbNav } from "@/components/Breadcrumb";

interface Guide {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
}

const guides: Guide[] = [
  {
    id: "personnaliser-couleurs",
    title: "Personnaliser les couleurs d'un picto",
    description:
      "Apprenez à modifier les couleurs d'un pictogramme SVG directement depuis l'application.",
    embedUrl:
      "https://scribehow.com/embed/Comment_personnaliser_les_couleurs_dun_picto__Da1fw1y_SlSSF3NFZ0GM6Q?skipIntro=true&as=video",
  },
  {
    id: "creer-collection",
    title: "Créer une collection personnelle et y ajouter des pictos",
    description:
      "Découvrez comment organiser vos pictogrammes favoris dans des collections personnalisées.",
    embedUrl:
      "https://scribehow.com/embed/Creer_une_collection_personnelle_et_y_ajouter_des_pictos__PC1YWr36RcWb6XQ-uwg2LA?skipIntro=true&as=video",
  },
];

export function GuidesPage() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12">
      <BreadcrumbNav
        items={[
          { label: "Accueil", href: "/" },
          { label: "Guides" },
        ]}
      />

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Guides</h1>
        <p className="text-sm text-muted-foreground">
          Des tutoriels pas-à-pas pour tirer le meilleur parti de La Boite à
          Pictos.
        </p>
      </div>

      <div className="space-y-6">
        {guides.map((guide) => {
          const isOpen = activeGuide === guide.id;
          return (
            <div
              key={guide.id}
              className="border border-border rounded-[4px] overflow-hidden"
            >
              {/* Guide header */}
              <button
                onClick={() =>
                  setActiveGuide(isOpen ? null : guide.id)
                }
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                  {isOpen ? (
                    <Play className="size-5 text-primary" />
                  ) : (
                    <BookOpen className="size-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {guide.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {guide.description}
                  </p>
                </div>
                <svg
                  className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Embed */}
              {isOpen && (
                <div className="border-t border-border bg-muted/20">
                  <iframe
                    src={guide.embedUrl}
                    title={guide.title}
                    width="100%"
                    height="800"
                    allow="fullscreen"
                    style={{
                      aspectRatio: "16 / 12",
                      border: 0,
                      minHeight: 480,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
