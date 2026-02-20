import { ArrowLeft } from "lucide-react";
import { LandingLayout } from "@/components/LandingLayout";
import type { GitHubUser } from "@/lib/github-auth";

interface PrivacyPageProps {
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function PrivacyPage({ user, onLogin, onLogout }: PrivacyPageProps) {
  return (
    <LandingLayout user={user} onLogin={onLogin} onLogout={onLogout}>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 mb-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Retour à l'accueil
        </a>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : février 2026
        </p>

        <div className="prose prose-sm max-w-none space-y-10 text-foreground">

          {/* 1. Responsable */}
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Responsable du traitement</h2>
            <div className="bg-muted/40 rounded-[4px] p-4 text-sm space-y-1">
              <p className="font-medium">Bruno Gauvillé</p>
              <p>78 promenade du Verger — 92130 Issy-les-Moulineaux</p>
              <p>
                <a href="mailto:admin@laboiteapicto.fr" className="text-primary underline underline-offset-2">
                  admin@laboiteapicto.fr
                </a>
              </p>
            </div>
          </section>

          {/* 2. Données collectées */}
          <section>
            <h2 className="text-lg font-semibold mb-3">2. Données collectées et finalités</h2>

            <h3 className="font-medium mt-4 mb-2">2.1 Données de profil GitHub</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Lors de la connexion via GitHub OAuth, les données suivantes sont récupérées
              auprès de GitHub et stockées sur nos serveurs :
            </p>
            <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
              <li>Identifiant GitHub (login)</li>
              <li>Nom d'affichage</li>
              <li>Adresse e-mail associée au compte GitHub</li>
              <li>URL de l'avatar</li>
              <li>Horodatages de première et dernière connexion</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium text-foreground">Finalité :</span>{" "}
              identification, personnalisation de l'interface, attribution des contributions.
              <br />
              <span className="font-medium text-foreground">Base légale :</span>{" "}
              intérêt légitime (art. 6.1.f RGPD) — permettre l'accès aux fonctionnalités
              personnalisées de l'application.
            </p>

            <h3 className="font-medium mt-6 mb-2">2.2 Données fonctionnelles</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Lors de l'utilisation des fonctionnalités connectées :
            </p>
            <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
              <li>Favoris enregistrés</li>
              <li>Collections personnelles (nom, description, pictogrammes)</li>
              <li>Likes sur les pictogrammes</li>
              <li>Pictogrammes personnels uploadés</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium text-foreground">Base légale :</span>{" "}
              exécution d'un contrat (art. 6.1.b RGPD) — ces données sont nécessaires
              à la fourniture des services explicitement demandés.
            </p>

            <h3 className="font-medium mt-6 mb-2">2.3 Adresses IP (téléchargements anonymes)</h3>
            <p className="text-sm text-muted-foreground">
              Les adresses IP des utilisateurs non connectés qui téléchargent des fichiers PNG
              sont temporairement enregistrées afin de limiter les téléchargements automatisés
              (1 téléchargement PNG par adresse IP et par période de 24 heures).
              <br />
              <span className="font-medium text-foreground">Durée de conservation :</span>{" "}
              7 jours.
              <br />
              <span className="font-medium text-foreground">Base légale :</span>{" "}
              intérêt légitime (art. 6.1.f RGPD) — prévention des abus et sécurité du service.
            </p>
          </section>

          {/* 3. Destinataires */}
          <section>
            <h2 className="text-lg font-semibold mb-3">3. Destinataires des données</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Vos données ne sont ni vendues ni cédées à des tiers à des fins commerciales.
              Elles sont partagées uniquement avec les sous-traitants techniques suivants :
            </p>
            <div className="space-y-3">
              <div className="border border-border rounded-[4px] p-4 text-sm">
                <p className="font-medium">GitHub (Microsoft Ireland Ltd)</p>
                <p className="text-muted-foreground mt-1">
                  Utilisé pour l'authentification OAuth. Microsoft Ireland Ltd, One Microsoft Place,
                  South County Business Park, Leopardstown, Dublin 18, Irlande.
                </p>
              </div>
              <div className="border border-border rounded-[4px] p-4 text-sm">
                <p className="font-medium">OVH SAS</p>
                <p className="text-muted-foreground mt-1">
                  Hébergement de l'application et des données. Serveurs situés en France.
                  OVH SAS, 2 rue Kellermann, 59100 Roubaix.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Transferts hors UE */}
          <section>
            <h2 className="text-lg font-semibold mb-3">4. Transferts hors Union européenne</h2>
            <p className="text-sm text-muted-foreground">
              L'authentification via GitHub implique une communication avec les serveurs de
              GitHub/Microsoft, dont certaines infrastructures sont situées aux États-Unis.
              Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) adoptées
              par la Commission européenne, mises en œuvre par GitHub dans le cadre de ses
              conditions d'utilisation.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              L'hébergement de l'application et des données utilisateurs est assuré par OVH
              en France, sans transfert hors de l'Union européenne.
            </p>
          </section>

          {/* 5. Durée de conservation */}
          <section>
            <h2 className="text-lg font-semibold mb-3">5. Durée de conservation</h2>
            <div className="overflow-x-auto">
              <table className="text-sm w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Données</th>
                    <th className="text-left py-2 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Profil GitHub (login, nom, email, avatar)</td>
                    <td className="py-2">Jusqu'à suppression du compte</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Favoris, collections, likes</td>
                    <td className="py-2">Jusqu'à suppression du compte</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Pictogrammes uploadés</td>
                    <td className="py-2">Jusqu'à suppression manuelle par le contributeur</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Adresses IP (téléchargements anonymes)</td>
                    <td className="py-2">7 jours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Droits */}
          <section>
            <h2 className="text-lg font-semibold mb-3">6. Vos droits</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Droit d'accès", desc: "Obtenir la liste des données vous concernant." },
                { title: "Droit de rectification", desc: "Les données de profil étant issues de GitHub, la rectification s'effectue directement dans vos paramètres GitHub." },
                { title: "Droit à l'effacement", desc: "Supprimez votre compte depuis le menu utilisateur (« Supprimer mon compte ») ou par e-mail." },
                { title: "Droit à la portabilité", desc: "Demandez une copie de vos données par e-mail." },
                { title: "Droit d'opposition", desc: "Vous opposer à un traitement fondé sur l'intérêt légitime." },
                { title: "Droit de réclamation", desc: "Saisir la CNIL à l'adresse www.cnil.fr ou par courrier : 3 place de Fontenoy, 75007 Paris." },
              ].map(({ title, desc }) => (
                <div key={title} className="border border-border rounded-[4px] p-3 text-sm">
                  <p className="font-medium mb-1">{title}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Pour exercer vos droits :{" "}
              <a href="mailto:admin@laboiteapicto.fr" className="text-primary underline underline-offset-2">
                admin@laboiteapicto.fr
              </a>
              . Nous nous engageons à répondre dans un délai d'un mois.
            </p>
          </section>

          {/* 7. Mise à jour */}
          <section>
            <h2 className="text-lg font-semibold mb-3">7. Mise à jour de cette politique</h2>
            <p className="text-sm text-muted-foreground">
              Cette politique peut être mise à jour pour refléter l'évolution des fonctionnalités
              de l'application ou de la réglementation. La date de dernière mise à jour est
              indiquée en haut de cette page.
            </p>
          </section>

        </div>
      </div>
    </LandingLayout>
  );
}
