# FileFixer — Local Development Guide

## Prerequisites

- **Node.js**: Version 20.x, 22.x, or higher.
- **Package Manager**: `npm` (version 10 or higher).
- **Git**: Modern Git client with LF line ending support.

---

## Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/manishmeena513/FileFixer.git
cd FileFixer
```

### 2. Install Application Dependencies
All application code resides in the `filefixer` directory:
```bash
cd filefixer
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser. Turbopack hot reloading is active by default.

---

## Available Scripts

All scripts should be executed from within the `filefixer/` directory:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js local development server on port 3000 |
| `npm test` | Executes the complete 4-tier automated test suite via `tsx` and Node.js test runner |
| `npm run build` | Compiles the production build and pre-renders all 33 static application routes |
| `npm run start` | Starts a production Next.js server locally |
| `npm run lint` | Runs ESLint to check for code quality and Next.js best practices |

---

## Project Structure Overview

```
FileFixer/
├── .github/                # GitHub workflows and issue/PR templates
│   ├── workflows/ci.yml    # Continuous Integration pipeline
│   ├── ISSUE_TEMPLATE/     # Standardized bug report & feature templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                   # Engineering and architecture documentation
│   ├── architecture.md     # System architecture & privacy invariants
│   ├── development.md      # This development guide
│   ├── deployment.md       # Vercel deployment guide
│   └── testing.md          # 4-tier testing matrix & specification
├── filefixer/              # Next.js 16 Application Root
│   ├── public/             # Static assets, branding, PWA manifest & worker
│   │   ├── branding/       # Official SVG logos, marks, and OG banners
│   │   ├── icons/          # PWA icons
│   │   └── images/         # Support QR assets
│   ├── src/
│   │   ├── app/            # App Router pages and metadata (33 static routes)
│   │   ├── components/     # UI primitives, layout, dialogs, and workstations
│   │   ├── lib/            # On-device transformation engines (image, pdf, batch)
│   │   ├── stores/         # Zustand reactive state stores
│   │   └── types/          # TypeScript interface definitions
│   ├── tests/              # 4-tier requirement & invariant test suite
│   ├── package.json        # Dependencies and scripts
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── tsconfig.json       # TypeScript configuration
├── .editorconfig           # IDE cross-platform formatting rules
├── .gitattributes          # Line ending normalization & binary rules
├── .gitignore              # Repository git ignore definitions
├── CONTRIBUTING.md         # Open-source contribution guidelines
├── README.md               # Product overview and documentation
└── SECURITY.md             # Security policy and vulnerability reporting
```

---

## Code Quality & Contribution Standards

1. **Zero Backend APIs**: Under no circumstances should backend API routes be added to `src/app/api`. FileFixer must remain 100% on-device.
2. **Accessible Touch Targets**: Buttons, icon buttons, tabs, and interactive elements must satisfy minimum touch target guidelines ($\ge 44 \times 44\text{px}$).
3. **Tabular Numerics**: Metric counters, percentages, and byte sizes must use `.tabular-nums` or `font-variant-numeric: tabular-nums`.
4. **Theme Parity**: All newly created UI components must support both dark and light modes with WCAG AA compliant text contrast.
5. **Automated Testing**: Whenever modifying file transformation algorithms or UI controls, ensure existing tests pass (`npm test`) and add unit or scenario tests in `tests/`.
