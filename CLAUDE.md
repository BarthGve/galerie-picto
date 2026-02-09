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
│   ├── planning-artifacts/   # Planning documents
│   └── implementation-artifacts/  # Implementation outputs
├── .claude/                  # Claude Code configuration
├── src/                      # Application source code
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   └── types/                # TypeScript type definitions
├── api/                      # Vercel serverless functions
│   ├── auth/                 # Authentication endpoints
│   └── upload/               # Upload management
├── public/                   # Static assets
├── dist/                     # Production build output
└── package.json              # Project dependencies and scripts
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

## Working with BMAD

If you need to understand BMAD workflows or tasks:
- Core configuration: `_bmad/core/config.yaml`
- Available workflows: Check `_bmad/core/workflows/` and `_bmad/bmm/workflows/`
- Task definitions: In `_bmad/core/tasks/`

The BMAD framework is self-documenting through its XML and markdown workflow files.
