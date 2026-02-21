import { Info } from "lucide-react";
import { BreadcrumbNav } from "@/components/Breadcrumb";

export function CookiesPage() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12">
      <BreadcrumbNav items={[
        { label: "Accueil", href: "/discover" },
        { label: "Cookies" },
      ]} />

      <h1 className="text-3xl font-bold text-foreground mb-2">
        Politique des cookies et du stockage local
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Dernière mise à jour : février 2026
      </p>

      <div className="space-y-10 text-foreground">

        {/* Intro */}
        <section>
          <p className="text-sm text-muted-foreground">
            La Boite à Pictos n'utilise pas de cookies au sens traditionnel du terme.
            L'application utilise exclusivement le <strong className="text-foreground">stockage local du navigateur</strong>{" "}
            (<code className="text-xs bg-muted px-1 py-0.5 rounded">localStorage</code> et{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">sessionStorage</code>),
            soumis aux mêmes règles que les cookies conformément à l'article 82 de
            la loi Informatique et Libertés.
          </p>
        </section>

        {/* Pas de bandeau */}
        <section>
          <div className="flex gap-3 bg-primary/5 border border-primary/20 rounded-[4px] p-4">
            <Info className="size-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Aucun bandeau de consentement requis.</span>{" "}
              Tous les éléments stockés dans votre navigateur sont strictement nécessaires
              au fonctionnement du service ou à sa sécurité. Ils sont exemptés de
              consentement préalable conformément aux lignes directrices de la CNIL.
            </p>
          </div>
        </section>

        {/* Tableau */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Ce qui est stocké dans votre navigateur</h2>
          <div className="space-y-3">
            {[
              {
                name: "github_token",
                storage: "localStorage",
                purpose: "Maintien de la session utilisateur. Contient le jeton d'accès GitHub transmis après connexion OAuth. Permet à l'application de vous identifier sans redemander votre mot de passe.",
                duration: "Jusqu'à la déconnexion ou révocation du jeton GitHub.",
                required: true,
              },
              {
                name: "theme",
                storage: "localStorage",
                purpose: "Mémorise votre préférence d'affichage (thème clair, sombre ou système).",
                duration: "Indéfinie — persiste jusqu'à ce que vous effaciez le stockage local.",
                required: true,
              },
              {
                name: "github_oauth_state",
                storage: "sessionStorage",
                purpose: "Jeton aléatoire généré lors de l'initiation de la connexion GitHub. Permet de vérifier que la réponse de GitHub correspond bien à la demande initiale (protection contre les attaques CSRF).",
                duration: "Durée de la session de navigation — supprimé automatiquement après connexion.",
                required: true,
              },
            ].map((item) => (
              <div key={item.name} className="border border-border rounded-[4px] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                  <code className="text-sm font-mono font-medium">{item.name}</code>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {item.storage}
                  </span>
                  <span className="ml-auto text-xs text-primary font-medium">
                    Nécessaire
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Finalité : </span>
                    <span className="text-muted-foreground">{item.purpose}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Durée : </span>
                    <span className="text-muted-foreground">{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pas de traceurs */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Absence de traceurs tiers</h2>
          <p className="text-sm text-muted-foreground">
            L'application ne dépose aucun cookie ou traceur à des fins de mesure d'audience,
            de publicité ou de profilage comportemental. Il n'existe aucune intégration de
            services tiers d'analyse (Google Analytics, Matomo, Hotjar, etc.).
          </p>
        </section>

        {/* Supprimer */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Supprimer ces données</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Vous pouvez supprimer ces données à tout moment :
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-foreground font-medium shrink-0">Via l'application :</span>
              cliquez sur votre avatar → « Déconnexion » pour effacer le jeton de session,
              ou « Supprimer mon compte » pour supprimer toutes vos données.
            </li>
            <li className="flex gap-2">
              <span className="text-foreground font-medium shrink-0">Via le navigateur :</span>
              accédez aux paramètres de votre navigateur → Confidentialité → Données du site →
              recherchez <code className="text-xs bg-muted px-1 py-0.5 rounded">laboiteapicto.fr</code> → Supprimer.
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground">
            Pour toute question relative au stockage de données dans votre navigateur :{" "}
            <a href="mailto:admin@laboiteapicto.fr" className="text-primary underline underline-offset-2">
              admin@laboiteapicto.fr
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
