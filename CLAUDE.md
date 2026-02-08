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
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Vercel Serverless Functions
- **Storage**: AWS S3 (upload via presigned URLs)
- **Authentification**: GitHub OAuth

### Build Commands
```bash
pnpm install          # Installer les dépendances
pnpm dev              # Démarrer le serveur de développement
pnpm build            # Construire pour la production
pnpm preview          # Prévisualiser le build de production
```

### Environment Variables
Voir `.env.example` pour la configuration requise :
- `VITE_GITHUB_CLIENT_ID` - ID client OAuth GitHub
- `GITHUB_CLIENT_SECRET` - Secret client GitHub
- `AWS_*` - Credentials AWS S3

### Deployment
- Hébergé sur Vercel
- Voir `VERCEL_DEPLOY.md` pour les instructions de déploiement
- Voir `UPLOAD_SETUP.md` pour la configuration du système d'upload

## Working with BMAD

If you need to understand BMAD workflows or tasks:
- Core configuration: `_bmad/core/config.yaml`
- Available workflows: Check `_bmad/core/workflows/` and `_bmad/bmm/workflows/`
- Task definitions: In `_bmad/core/tasks/`

The BMAD framework is self-documenting through its XML and markdown workflow files.
