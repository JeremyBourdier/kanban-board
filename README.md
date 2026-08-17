# Kanban Project

A modern, single-board Kanban project management web application built with Next.js and TypeScript.

## Features

- Single board with 5 fixed columns (Backlog, Ready, In Progress, In Review, Done)
- In-place column renaming
- Card creation with title and details
- Card deletion
- Drag and drop cards within and across columns
- Dark and light mode themes with persistence
- Pre-populated dummy data for instant preview

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation and Running Locally

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing with Playwright (Chromium)

All testing (unit tests, boundary/limit tests, and end-to-end user flows) is unified under Playwright using Chromium:

```bash
# Run all tests (unit, limit, e2e)
npm run test

# Run tests in headed browser mode (visible UI)
npm run test:headed

# Open interactive Playwright UI dashboard
npm run test:ui

# View HTML test report
npm run test:report
```
