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
└── .claude/                  # Claude Code configuration
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

⚠️ **This project is currently empty** - no application code has been written yet.

When code is added to this project, update this CLAUDE.md with:
- Build commands (npm/pnpm scripts, build tools)
- Test commands and framework details
- Application architecture and patterns
- Key directories and their purposes
- Environment variables and configuration
- Deployment process

## Working with BMAD

If you need to understand BMAD workflows or tasks:
- Core configuration: `_bmad/core/config.yaml`
- Available workflows: Check `_bmad/core/workflows/` and `_bmad/bmm/workflows/`
- Task definitions: In `_bmad/core/tasks/`

The BMAD framework is self-documenting through its XML and markdown workflow files.
