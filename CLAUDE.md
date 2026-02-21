# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "galerie" project - currently a new/empty project initialized with the BMAD (Brain-Motivated Agile Development) framework v6.0.0-Beta.7.

**User**: Bruno (French-speaking)
**Languages**: Communication in French, documentation output in French

## Current Project Structure

```
galerie/
├── _bmad/                    # BMAD framework (DO NOT modify)
│   ├── core/                 # Core BMAD workflows and tasks
│   └── bmm/                  # BMAD Module Manager workflows
├── _bmad-output/             # Generated artifacts from BMAD workflows
├── .claude/                  # Claude Code configuration
├── src/                      # Frontend React
│   ├── components/           # React components (PictoGrid, PictoCard, Sidebar, etc.)
│   ├── hooks/                # Custom hooks (usePictograms, useGalleries)
│   └── lib/                  # Utilitaires et types
├── backend/                  # Backend Express.js
│   ├── drizzle/              # Migrations SQL generees par Drizzle Kit
│   └── src/
│       ├── db/               # Base de donnees SQLite
│       │   ├── schema.ts     # Schema Drizzle (pictograms, galleries, downloads, users, favorites)
│       │   ├── index.ts      # Connexion et migrations
│       │   ├── seed-from-minio.ts  # Script de migration one-shot depuis JSON Minio
│       │   └── repositories/ # Repositories (pictograms, galleries, downloads, users, favorites)
│       ├── routes/           # Endpoints API (auth, upload, galleries, pictograms, proxy, favorites)
│       ├── services/         # Services (minio S3, svg-sanitizer, dsfr-dark)
│       ├── middleware/       # Auth middleware (auth.ts pour collaborateurs, auth-any-user.ts pour tous)
│       └── config.ts         # Configuration et validation env vars
├── public/                   # Static assets
├── dist/                     # Production build output
└── package.json              # Dependencies et scripts
```

## BMAD Framework Integration

This project uses the BMAD framework for structured development workflows. The framework provides:

- **Workflows**: Multi-step guided processes (planning, UX design, PRD creation, etc.)
- **Tasks**: Single-purpose operations (editorial review, document sharding, etc.)
- **Agents**: Specialized personas for different development phases

### Key BMAD Concepts

- Output files go to `_bmad-output/` directory (configured in `_bmad/core/config.yaml`)
- Never modify files in `_bmad/` directory - these are framework files
- BMAD workflows are invoked via the bmad-master agent or specific workflow files

## Development Status

✅ **Application active** - Galerie de pictogrammes avec upload et authentification GitHub

### Technology Stack
- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **UI**: Tailwind CSS 4 + shadcn/ui components
- **Backend**: Express.js (dossier `backend/`)
- **Database**: SQLite (via Drizzle ORM + better-sqlite3)
- **Storage**: Minio S3-compatible (cdn.kerjean.net) — uniquement pour les fichiers SVG
- **Authentification**: GitHub OAuth (2 niveaux : `authMiddleware` pour collaborateurs, `authAnyUser` pour tout utilisateur connecte)
- **Deploiement**: VPS (CI/CD via GitHub Actions → push sur le VPS)

### Build Commands
```bash
pnpm install          # Installer les dependances (racine)
cd backend && pnpm install  # Installer les dependances backend
pnpm dev              # Lancer backend (:3004) + frontend (:5175)
pnpm dev:backend      # Lancer uniquement le backend
pnpm dev:frontend     # Lancer uniquement le frontend
pnpm build            # Construire le frontend pour la production
```

### Ports de developpement
- **Frontend**: http://localhost:5175
- **Backend**: http://localhost:3004

### Environment Variables
- Frontend : `VITE_API_URL` (en prod, pointe vers le backend Railway)
- Backend : voir `backend/.env` (non commite) avec :
  - `PORT`, `CORS_ORIGIN`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_USERNAME`
  - `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_PREFIX`
  - `DATABASE_PATH` (optionnel, defaut `./data/galerie.db`)

### Deployment
- Heberge sur un VPS via CI/CD GitHub Actions
- Ne jamais utiliser les outils Railway ni mentionner Railway

## Bonnes pratiques Performance

### Frontend
- **Code splitting** : Utiliser `React.lazy()` + `Suspense` pour les composants lourds (modals, dialogs, formulaires). Ne monter les modals que quand elles sont ouvertes (`{isOpen && <Suspense><Modal/></Suspense>}`)
- **Pagination** : La grille affiche 50 pictogrammes par page (composant `PictoGrid`). Toujours paginer les listes volumineuses cote client
- **Images** : Ajouter `decoding="async"` et `width`/`height` explicites sur les `<img>` pour eviter le layout shift
- **Preconnect** : Les origines CDN et API externes sont declarees en `<link rel="preconnect">` dans `index.html`
- **Fetch** : Ne PAS utiliser `cache: "no-store"` sur les requetes GET. Laisser le navigateur gerer le cache HTTP (ETag/304)
- **Source maps** : Desactivees en production (`build.sourcemap: false` dans `vite.config.ts`)
- **No-cache** : Seules les reponses aux mutations (POST/PUT/DELETE) ont `Cache-Control: no-store`
- **Refs stables** : Pour les callbacks qui accedent a un state sans en etre dependants, utiliser `useRef` + mise a jour synchrone (`countsRef.current = counts`) plutot que de les mettre dans les deps du `useCallback`
- **Motion** : Toujours preferer `motion-safe:animate-*` pour respecter les preferences utilisateur (`prefers-reduced-motion`)
- **Promise.allSettled** : Utiliser pour les refetch paralleles independants, mais logger les echecs pour eviter les donnees perimees silencieuses

### Backend
- **SQLite + Drizzle ORM** : Toutes les donnees (pictogrammes, galleries, downloads, users, favoris) sont stockees dans SQLite via Drizzle ORM. Les fichiers JSON sur Minio ne sont plus utilises.
- **Minio** : Utilise uniquement pour le stockage des fichiers SVG binaires (`writeSvgFile`, `deleteFile`, `readFileAsText`)
- **Cache en memoire** : Les repositories `pictograms.ts` et `galleries.ts` maintiennent un cache avec TTL de 30s et JSON pre-serialise
- **Token cache** : `backend/src/middleware/token-cache.ts` — cache les JWT verifies 5 min (evite `jwt.verify()` + `upsertUser()` a chaque requete). Toujours utiliser `getCachedToken` / `setCachedToken` dans les middlewares auth.
- **ETag/304** : Les endpoints GET `/api/pictograms/manifest` et `/api/galleries` supportent `If-None-Match` et renvoient 304 si le contenu n'a pas change
- **WAL mode + pragmas** : SQLite configure en WAL avec `synchronous=NORMAL`, `cache_size=-20000`, `busy_timeout=5000`. Ne pas modifier ces pragmas sans raison.
- **Serialisation JSON** : Les repositories retournent du JSON pre-serialise (string). Ne PAS re-parser puis re-serialiser dans les routes (double overhead). Si une route agregee a besoin d'un objet, le parser une seule fois.
- **Index SQLite** : Toujours ajouter un index sur les colonnes utilisees en `WHERE` ou `JOIN` frequents (foreign keys notamment). Generer via Drizzle Kit.
- **Seed script** : `backend/src/db/seed-from-minio.ts` permet de migrer les donnees existantes depuis les fichiers JSON Minio vers SQLite
- **Compression** : Le middleware `compression()` est actif sur toutes les reponses

## Bonnes pratiques Securite

### Frontend
- **CSP** : Une meta tag Content-Security-Policy est definie dans `index.html`. La mettre a jour si de nouvelles origines sont ajoutees
- **Pas de secrets** : Aucun secret cote client. Le token GitHub est stocke en `localStorage` et envoye via header `Authorization: Bearer`
- **JWT frontend** : Le frontend decode le JWT localement pour lire les infos utilisateur (expiration, login) — c'est acceptable car le frontend n'est PAS une frontiere de securite. La verification de signature se fait uniquement cote backend.

### Backend
- **Sanitisation SVG** : Tous les SVG uploades sont sanitises via DOMPurify (`backend/src/services/svg-sanitizer.js`). Ne JAMAIS servir de SVG non sanitise
- **Helmet** : Headers de securite configures via `helmet()` avec `crossOriginResourcePolicy: "cross-origin"`
- **Rate limiting** : 3 niveaux configures dans `backend/src/index.ts` :
  - API generale : 200 req/min
  - Upload : 30 req/min
  - Auth : 10 req/min
- **Validation des entrees** :
  - Noms de collections : max 100 caracteres
  - Couleurs : format `#rrggbb` uniquement
  - Tags : max 30 tags, 50 caracteres chacun
  - Noms de fichiers SVG : valides via `isValidSvgFilename()`
  - Taille SVG : validee via `isValidSvgContent()`
- **Proxy** : Le proxy CDN (`backend/src/routes/proxy.ts`) a un timeout de 10s et une limite de 2MB
- **Variables d'environnement** : Les variables requises sont validees au demarrage dans `backend/src/config.ts` (crash si manquantes). `JWT_SECRET` leve une exception immediate si absent en prod (ne pas utiliser de fallback vide).
- **OAuth** : Le parametre `state` est utilise pour prevenir les attaques CSRF lors du flow GitHub OAuth
- **Path traversal** : Les cles S3 sont construites a partir du prefix configure, pas depuis l'input utilisateur brut
- **Webhook GitHub** : Toujours verifier la signature HMAC `x-hub-signature-256`. Si `GITHUB_WEBHOOK_SECRET` n'est pas configure, retourner 503 (ne jamais skipper la validation).
- **Middlewares auth — lequel utiliser** :
  - `authMiddleware` (`backend/src/middleware/auth.ts`) : verifie `isCollaborator` ou `allowedUsername`. Utiliser pour upload, routes admin, operations sensibles.
  - `authAnyUser` (`backend/src/middleware/auth-any-user.ts`) : accepte tout utilisateur GitHub connecte. Utiliser pour likes, feedback, collections utilisateur.
- **JWT — revocation** : Les JWT ont une TTL de 24h. La perte de statut collaborateur n'est pas effective avant expiration du token (design stateless assume). Ne pas essayer de verifier le statut collaborateur a chaque requete.
- **Codes HTTP auth** : Utiliser `401` pour toutes les erreurs d'authentification (token invalide/expire/manquant). Utiliser `403` pour les erreurs d'autorisation (token valide mais acces refuse). Ne jamais renvoyer `500` pour une erreur auth.
- **req.params en TypeScript** : Toujours caster les params Express avec `String(req.params.xxx)` plutot que de les destructurer directement. Le type infere est `string | string[]` en config stricte, ce qui cause des TS2345 en prod.
- **Migrations Drizzle** : Ne jamais creer les fichiers SQL manuellement. Toujours utiliser `pnpm drizzle-kit generate` dans `backend/`. Les migrations manuelles sans snapshot sont silencieusement ignorees par Drizzle. Si une migration a deja ete appliquee a la main via sqlite3, inserer son hash SHA-256 dans `__drizzle_migrations` avec `shasum -a 256 fichier.sql`.
- **Ban utilisateur** : `backend/src/middleware/ban-list.ts` maintient un Set en memoire charge au demarrage depuis la DB (`initBanList`). Les deux middlewares auth verifient `isBanned()` apres chaque cache-hit pour enforcement immediat (sans attendre expiration du JWT).
- **Filtres de tags (frontend)** : L'etat `activeTag` dans `PictoGrid` est local. Utiliser une `key` dynamique sur `<PictoGrid>` dans App.tsx pour forcer le reset a chaque changement de galerie/collection/favoris : `key={\`\${selectedGalleryId}|\${selectedUserCollectionId}|\${showFavoritesOnly}\`}`.

## Working with BMAD

If you need to understand BMAD workflows or tasks:
- Core configuration: `_bmad/core/config.yaml`
- Available workflows: Check `_bmad/core/workflows/` and `_bmad/bmm/workflows/`
- Task definitions: In `_bmad/core/tasks/`

The BMAD framework is self-documenting through its XML and markdown workflow files.

# MCP Gemini Design - MANDATORY UNIQUE WORKFLOW

## ABSOLUTE RULE

You NEVER write frontend/UI code yourself. Gemini is your frontend developer.

---

## AVAILABLE TOOLS

### `generate_vibes`
Generates a visual page with 5 differently styled sections. The user opens the page, sees all 5 vibes, and picks their favorite. The code from the chosen vibe becomes the design-system.md.

### `create_frontend`
Creates a NEW complete file (page, component, section).

### `modify_frontend`
Makes ONE design modification to existing code. Returns a FIND/REPLACE block to apply.

### `snippet_frontend`
Generates a code snippet to INSERT into an existing file. For adding elements without rewriting the entire file.

---

## WORKFLOW (NO ALTERNATIVES)

### STEP 1: Check for design-system.md

BEFORE any frontend call → check if `design-system.md` exists at project root.

### STEP 2A: If design-system.md DOES NOT EXIST

1. Call `generate_vibes` with projectDescription, projectType, techStack
2. Receive the code for a page with 5 visual sections
3. Ask: "You don't have a design system. Can I create vibes-selection.tsx so you can visually choose your style?"
4. If yes → Write the page to the file
5. User chooses: "vibe 3" or "the 5th one"
6. Extract THE ENTIRE CODE between `<!-- VIBE_X_START -->` and `<!-- VIBE_X_END -->`
7. Save it to `design-system.md`
8. Ask: "Delete vibes-selection.tsx?"
9. Continue normally

### STEP 2B: If design-system.md EXISTS

Read it and use its content for frontend calls.

### STEP 3: Frontend Calls

For EVERY call (create_frontend, modify_frontend, snippet_frontend), you MUST pass:

- `designSystem`: Copy-paste the ENTIRE content of design-system.md (all the code, not a summary)
- `context`: Functional/business context WITH ALL REAL DATA. Include:
  - What it does, features, requirements
  - ALL real text/labels to display (status labels, button text, titles...)
  - ALL real data values (prices, stats, numbers...)
  - Enum values and their exact meaning
  - Any business-specific information

**WHY**: Gemini will use placeholders `[Title]`, `[Price]` for missing info. If you don't provide real data, you'll get placeholders or worse - fake data.

---

## FORBIDDEN

- Writing frontend without Gemini
- Skipping the vibes workflow when design-system.md is missing
- Extracting "rules" instead of THE ENTIRE code
- Manually creating design-system.md
- Passing design/styling info in `context` (that goes in `designSystem`)
- Summarizing the design system instead of copy-pasting it entirely
- Calling Gemini without providing real data (labels, stats, prices, etc.) → leads to fake info

## EXPECTED

- Check for design-system.md BEFORE anything
- Follow the complete vibes workflow if missing
- Pass the FULL design-system.md content in `designSystem`
- Pass functional context in `context` (purpose, features, requirements)

## EXCEPTIONS (you can code these yourself)

- Text-only changes
- JS logic without UI
- Non-visual bug fixes
- Data wiring (useQuery, etc.)
