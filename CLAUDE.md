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
│   └── src/
│       ├── routes/           # Endpoints API (auth, upload, galleries, pictograms, proxy)
│       ├── services/         # Services (minio S3, svg-sanitizer, dsfr-dark)
│       ├── middleware/       # Auth middleware
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
- **Storage**: Minio S3-compatible (cdn.kerjean.net)
- **Authentification**: GitHub OAuth
- **Deploiement**: Railway (frontend + backend)

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

### Deployment
- Heberge sur Railway
- Frontend : service `galerie-picto` (RAILPACK/Vite)
- Backend : service `galerie-backend` (Dockerfile, root directory = `backend/`)

## Bonnes pratiques Performance

### Frontend
- **Code splitting** : Utiliser `React.lazy()` + `Suspense` pour les composants lourds (modals, dialogs, formulaires). Ne monter les modals que quand elles sont ouvertes (`{isOpen && <Suspense><Modal/></Suspense>}`)
- **Pagination** : La grille affiche 50 pictogrammes par page (composant `PictoGrid`). Toujours paginer les listes volumineuses cote client
- **Images** : Ajouter `decoding="async"` et `width`/`height` explicites sur les `<img>` pour eviter le layout shift
- **Preconnect** : Les origines CDN et API externes sont declarees en `<link rel="preconnect">` dans `index.html`
- **Fetch** : Ne PAS utiliser `cache: "no-store"` sur les requetes GET. Laisser le navigateur gerer le cache HTTP (ETag/304)
- **Source maps** : Desactivees en production (`build.sourcemap: false` dans `vite.config.ts`)
- **No-cache** : Seules les reponses aux mutations (POST/PUT/DELETE) ont `Cache-Control: no-store`

### Backend
- **Lectures S3** : Utiliser le SDK S3 directement (`GetObjectCommand` + `transformToString()`). Ne JAMAIS utiliser des URLs signees + fetch HTTP pour lire des fichiers depuis le meme backend
- **Cache en memoire** : `minio.ts` maintient un cache JSON avec TTL de 30s et JSON pre-serialise pour eviter `JSON.stringify()` a chaque requete
- **ETag/304** : Les endpoints GET `/api/pictograms/manifest` et `/api/galleries` supportent `If-None-Match` et renvoient 304 si le contenu n'a pas change
- **JSON compact** : `writeJsonFile` ecrit du JSON sans pretty-print pour reduire la taille ~30%
- **Type de retour** : `readJsonFile<T>()` retourne `JsonReadResult<T> | null` avec `{ data, json, etag }`. Toujours destructurer `.data` pour acceder aux donnees
- **Compression** : Le middleware `compression()` est actif sur toutes les reponses

## Bonnes pratiques Securite

### Frontend
- **CSP** : Une meta tag Content-Security-Policy est definie dans `index.html`. La mettre a jour si de nouvelles origines sont ajoutees
- **Pas de secrets** : Aucun secret cote client. Le token GitHub est stocke en `localStorage` et envoye via header `Authorization: Bearer`

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
- **Variables d'environnement** : Les variables requises sont validees au demarrage dans `backend/src/config.ts` (crash si manquantes)
- **OAuth** : Le parametre `state` est utilise pour prevenir les attaques CSRF lors du flow GitHub OAuth
- **Path traversal** : Les cles S3 sont construites a partir du prefix configure, pas depuis l'input utilisateur brut

## Working with BMAD

If you need to understand BMAD workflows or tasks:
- Core configuration: `_bmad/core/config.yaml`
- Available workflows: Check `_bmad/core/workflows/` and `_bmad/bmm/workflows/`
- Task definitions: In `_bmad/core/tasks/`

The BMAD framework is self-documenting through its XML and markdown workflow files.
