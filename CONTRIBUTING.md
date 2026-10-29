# Contributing to FileFixer

Thank you for your interest in contributing to FileFixer!

FileFixer is dedicated to building fast, beautiful, and strictly private file utilities. We welcome issues, bug reports, feature requests, and code contributions from the community.

---

## Foundational Principle: Zero Server Uploads

Before contributing any code, please note our core architectural invariant:
> **All transformations must run 100% on-device in the user's browser.**
> We do not accept features or dependencies that upload file contents, image bytes, PDF streams, or user metadata to external servers or cloud APIs.

---

## Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/FileFixer.git
   cd FileFixer
   ```

2. **Navigate to the application directory** and install dependencies:
   ```bash
   cd filefixer
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app with Turbopack hot reloading.

---

## Coding Standards & Guidelines

### 1. Mobile Responsiveness & Touch Targets
- All interactive controls (buttons, tabs, switches, sliders) must satisfy a minimum touch target bounding box of **$\ge 44 \times 44\text{px}$** (or $\ge 48\text{px}$ for bottom navigation items).
- Avoid rigid multi-column layouts on mobile viewports ($<640\text{px}$). Ensure text truncates with `min-w-0` and wrapping flexboxes where needed.

### 2. Design System & Theme Parity
- FileFixer supports both Dark and Light modes using CSS variables defined in `src/app/globals.css`.
- Ensure all text, badges, and buttons achieve **WCAG AA contrast ratios ($\ge 4.5:1$)**.
- Metrics, byte sizes, and numeric counters must use `.tabular-nums` for consistent column alignment.

### 3. Automated Testing
- All file manipulation algorithms, format parsers, and utilities should have test coverage in `filefixer/tests/`.
- Ensure the full test suite passes before submitting:
  ```bash
  npm test
  ```
- Ensure the production build succeeds without warnings:
  ```bash
  npm run build
  ```

---

## Pull Request Process

1. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit your changes** with descriptive commit messages following the Conventional Commits style (e.g., `feat(image): add avif export option`, `fix(pdf): handle rotated page split bounds`).
3. **Run all tests and build**:
   ```bash
   cd filefixer
   npm test
   npm run build
   ```
4. **Push to your fork** and submit a Pull Request to `main`.
5. Complete the provided Pull Request template checklist.

---

## Reporting Issues & Requesting Features

- **Bug Reports**: Please use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include steps to reproduce, device/browser details, and expected behavior.
- **Feature Requests**: Please use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md). Confirm whether the proposed tool can run client-side in the browser.
- **Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) for responsible disclosure.
