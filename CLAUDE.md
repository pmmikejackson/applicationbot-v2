# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ApplicationBot-v2 is an AI-assisted software development workflow system. Rather than being a traditional application, it provides structured workflows for AI assistants to follow when helping build software projects. The system uses `.mdc` files (Markdown with metadata) that contain detailed instructions for different phases of development.

## Core Workflow Architecture

The system follows a three-stage development process:

1. **PRD Creation** (`create-prd.mdc`): Generate Product Requirements Documents from user requests
2. **Task Generation** (`generate-tasks.mdc`): Convert PRDs into structured task lists
3. **Task Implementation** (`process-task-list.mdc`): Execute tasks incrementally with user approval

### Key Workflow Principles

- **Human-in-the-loop**: Always require user confirmation at key decision points
- **One sub-task at a time**: Never work on multiple sub-tasks simultaneously
- **Documentation-first**: Create PRDs before any implementation
- **Junior developer focus**: All outputs should be clear and educational for junior developers

## Working with This Repository

### Directory Structure

```
/
├── create-prd.mdc          # PRD generation workflow
├── generate-tasks.mdc      # Task list generation workflow
├── process-task-list.mdc   # Task execution workflow
└── tasks/                  # Directory for generated PRDs and task lists (create if needed)
```

### File Naming Conventions

- PRDs: `tasks/prd-[feature-name].md`
- Task Lists: `tasks/tasks-[prd-file-name].md`

### Workflow Execution

When following any `.mdc` workflow:

1. Read the entire workflow file first to understand the complete process
2. Follow the steps exactly as specified
3. Always wait for user confirmation when indicated (e.g., "Go" command)
4. Maintain the specified file formats and naming conventions

### Important Implementation Notes

1. **Task Management**: When using `process-task-list.mdc`, strictly adhere to the one-sub-task-at-a-time rule
2. **File Updates**: Always update the "Relevant Files" section in task lists as files are created/modified
3. **User Interaction**: Ask clarifying questions as specified in the PRD workflow before proceeding
4. **Output Location**: Create the `/tasks` directory if it doesn't exist before saving any generated files

## Development Guidelines

Since this is a workflow system rather than a traditional codebase:

- There are no build, test, or lint commands
- No package dependencies to install
- Focus is on following the structured workflows accurately
- Ensure all generated documentation is comprehensive and junior-developer-friendly

## Critical Reminders

- Never skip the user confirmation steps in the workflows
- Always save generated files to the `/tasks` directory
- Follow the exact markdown formats specified in each workflow
- When implementing tasks, update completion status immediately after finishing each sub-task