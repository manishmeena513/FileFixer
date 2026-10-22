# Implementation Recommendation Plan: Milestone 1 Global Application Shell

**Author**: M1 Application Shell Explorer (`explorer_m1_3`)  
**Target Codebase**: `filefixer/src/`  
**Referenced Specs**: `ORIGINAL_REQUEST.md` (R1, R5), `PROJECT.md` (M1), `survey_report.md` (Survey 1)  
**Status**: Ready for Implementation  
**Integrity Mode**: Development (Read-Only Investigation & Implementation Design)

---

## 1. Executive Summary

This implementation plan details the exact, line-by-line code changes required for **Milestone 1: Global Application Shell**. The plan hardens accessibility, eliminates touch target failures, prevents layout shifts, and ensures flawless responsive coordination across desktop, tablet, and mobile viewports.

### Primary Objectives Covered
1. **Header Navigation Dropdowns (`Header.tsx`)**: Replace unannounced CSS-only hover menus with accessible ARIA disclosure patterns (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`), keyboard navigation (`Enter`, `Space`, `ArrowDown`, `Escape`), and outside-click dismissal.
2. **Mobile Touch Target Compliance (≥44×44px)**:
   - Header search trigger button: Increase mobile height from 30px to `min-h-[44px]`.
   - Theme toggle button (`ThemeToggle.tsx`): Increase mobile hit area from 36×36px (`h-9 w-9`) to `h-11 w-11` (44×44px).
   - Command Center input clear button (`CommandCenter.tsx`): Increase from ~24×24px (`p-1`) to `h-11 w-11` (44×44px on mobile, responsive `sm:h-8 sm:w-8`).
   - Header Workspace pill button: Increase mobile height from 38px to `min-h-[44px]`.
3. **Universal Command Center Hardening (`CommandCenter.tsx`)**:
   - Implement an airtight keyboard Tab focus trap that keeps focus inside the active modal dialog.
   - Restore previous active element focus upon closing.
   - Establish valid WAI-ARIA Combobox / Listbox / Option hierarchy (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-activedescendant`).
   - Automatically scroll keyboard-navigated options into visible view.
   - Lock body background scrolling while open.
4. **Mobile Bottom Navigation & Footer Coordination (`MobileBottomNav.tsx` & `Footer.tsx`)**:
   - Verify `min-h-[48px]` touch targets in `MobileBottomNav.tsx` (already compliant).
   - Add high-contrast active indicator styling, active accent bar, and `aria-current="page"`.
   - Apply `.tabular-nums` to badge counters.
   - Coordinate footer bottom padding with dynamic iOS/PWA safe-area insets (`pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0`) to eliminate bottom navigation occlusion.
   - Lock body scrolling when Header mobile drawer is opened.

---

## 2. Component Inspection & Architectural Findings

### 2.1 `Header.tsx` (`filefixer/src/components/layout/Header.tsx`)
- **Current Behavior**:
  - Desktop dropdowns (`Studios`, `Images`, `PDF`) use purely CSS `:hover` / `:focus-within` via `.group-hover:block`.
  - The dropdown `<button>` elements lack `aria-haspopup`, `aria-expanded`, and `aria-controls`.
  - Screen reader users are not notified that a menu exists, and keyboard users cannot toggle or dismiss menus via `Enter` or `Escape`.
  - The search trigger button on mobile has dimensions `px-3 py-1.5 text-xs` (~30px height), failing the 44px WCAG / Apple HIG touch standard.
  - The Workspace route link is `min-h-[38px]`, failing the 44px mobile requirement.
  - Opening the mobile hamburger menu mounts an in-flow drawer without locking body scroll, allowing background content to scroll beneath.
- **Remediation**:
  - Add explicit state `openDropdown: string | null` with keydown handling (`Enter`, `Space`, `ArrowDown`, `Escape`), click-outside detection, and route change cleanup.
  - Provide full ARIA attributes (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `role="menu"`, `role="menuitem"`).
  - Enforce `min-h-[44px] sm:min-h-0 sm:h-9` on the search trigger.
  - Enforce `min-h-[44px] sm:min-h-[38px]` on the Workspace button, with `.tabular-nums` on the badge.
  - Lock `document.body.style.overflow = "hidden"` when `mobileOpen` is active.

### 2.2 `ThemeToggle.tsx` (`filefixer/src/components/layout/ThemeToggle.tsx`)
- **Current Behavior**:
  - Rendered with `size="icon"` which defaults to `h-9 w-9` (36×36px), and hardcoded `className="h-9 rounded-xl..."`.
  - On mobile, this falls 8px short of the 44×44px touch target requirement.
- **Remediation**:
  - Update `Button` sizing to `h-11 w-11 sm:h-9 sm:w-9` (44×44px on mobile, 36×36px on desktop `sm:`).
  - Update the unmounted hydration placeholder to match identical `h-11 w-11 sm:h-9 sm:w-9` geometry to eliminate layout shift during React hydration.

### 2.3 `CommandCenter.tsx` (`filefixer/src/components/command/CommandCenter.tsx`)
- **Current Behavior**:
  - Focus is set to `inputRef` on mount, but pressing `Tab` allows focus to escape the modal into hidden background DOM nodes.
  - Closing the modal does not restore focus to the previously active element (e.g., search trigger button).
  - Search results are rendered with `role="option"`, but the parent container (`listRef`) has no `role="listbox"`, creating an orphaned ARIA role violation.
  - Input field lacks combobox attributes (`role="combobox"`, `aria-controls`, `aria-activedescendant`).
  - Clear input button has `p-1 rounded` with a 16px icon (~24×24px tap area), failing touch guidelines.
  - Background scrolling is not locked when the dialog overlay is active.
- **Remediation**:
  - Implement Tab key focus trap inside the modal dialog container.
  - Save `document.activeElement` on open and restore on close.
  - Lock `document.body.style.overflow = "hidden"` while open.
  - Add `role="listbox"`, `id="command-results-listbox"`, and `aria-label="Search suggestions"` to results container.
  - Add `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls="command-results-listbox"`, and `aria-activedescendant` to input.
  - Add `id={`command-opt-${item.id}`}` to each option button and auto-scroll the selected option into view.
  - Expand clear button to `h-11 w-11 sm:h-8 sm:w-8 flex items-center justify-center`.

### 2.4 `MobileBottomNav.tsx` (`filefixer/src/components/layout/MobileBottomNav.tsx`)
- **Current Behavior**:
  - All 5 items have `min-h-[48px]`, fully satisfying the ≥44px requirement.
  - Container uses `pb-safe` (`padding-bottom: env(safe-area-inset-bottom, 0px)`).
  - Active route indication is subtle (only changes text color from muted to primary without background or indicator line).
  - Lacks `aria-current="page"`.
  - Workspace counter badge lacks `.tabular-nums`.
- **Remediation**:
  - Add `aria-current={pathname === link.href ? "page" : undefined}` on all links.
  - Add high-contrast active state styling: subtle background pill `bg-[hsl(var(--primary)/0.08)] font-semibold` and a top accent bar `h-0.5 w-6 bg-[hsl(var(--primary))]`.
  - Add `.tabular-nums` to the workspace file count badge.

### 2.5 `Footer.tsx` (`filefixer/src/components/layout/Footer.tsx`)
- **Current Behavior**:
  - Bottom padding is set to `pb-20 md:pb-0` (80px on mobile).
  - On iOS devices or installed PWAs, `MobileBottomNav` height is 64px + safe area inset (up to 34px = 98px).
  - Because 80px < 98px, the bottom-most footer rows (developer credit and tagline) can be partially or completely occluded by the fixed bottom nav.
- **Remediation**:
  - Update padding to `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` (or `pb-24 pb-safe md:pb-0`).
  - Add comfortable touch padding (`py-1 inline-block`) to footer links on mobile.

---

## 3. Exact Line-by-Line Implementation Recommendations

### 3.1 `Header.tsx`
**File Path**: `filefixer/src/components/layout/Header.tsx`

#### Change 1: Add Dropdown State, Click-Outside Listener, and Body Scroll Lock
**Lines to Modify**: Lines 90–97

```tsx
// BEFORE:
export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { files, setCommandCenterOpen, setShortcutsOpen } = useFileStore();

  const fileCount = files.length;
```

```tsx
// AFTER:
export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = React.useRef<HTMLElement>(null);
  const { files, setCommandCenterOpen, setShortcutsOpen } = useFileStore();

  const fileCount = files.length;

  // Close dropdowns and mobile menu on route change
  React.useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  // Click outside listener for navigation dropdowns
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);
```

#### Change 2: Command Center Search Trigger ≥44px Mobile Touch Target
**Lines to Modify**: Lines 110–122

```tsx
// BEFORE:
        {/* Universal Command Center Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--foreground))] transition-all shadow-xs"
          aria-label="Open Command Center (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          <span className="hidden sm:inline">Search tools & actions...</span>
          <span className="sm:hidden">Search</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            Ctrl+K
          </kbd>
        </button>
```

```tsx
// AFTER:
        {/* Universal Command Center Search Trigger */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[44px] sm:min-h-0 sm:h-9 items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 sm:py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--foreground))] transition-all shadow-xs cursor-pointer"
          aria-label="Open Command Center (Ctrl+K)"
        >
          <Search className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[hsl(var(--primary))]" />
          <span className="hidden sm:inline">Search tools & actions...</span>
          <span className="sm:hidden font-medium">Search</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            Ctrl+K
          </kbd>
        </button>
```

#### Change 3: Navigation Dropdown ARIA Attributes & Keyboard Navigation
**Lines to Modify**: Lines 125–178

```tsx
// BEFORE:
        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 lg:flex ml-2"
          aria-label="Main navigation"
        >
          {navLinks.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors",
                    link.children.some((c) => pathname === c.href)
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform duration-150 group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 top-full hidden w-56 pt-1.5 group-hover:block group-focus-within:block">
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] py-1.5 shadow-xl animate-scale-in">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-4 py-2 text-xs xl:text-sm transition-colors",
                          pathname === child.href
                            ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))] font-medium"
                            : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
```

```tsx
// AFTER:
        {/* Desktop nav */}
        <nav
          ref={navRef}
          className="hidden items-center gap-0.5 lg:flex ml-2"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => {
            const isDropdownOpen = openDropdown === link.label;
            const dropdownId = `nav-dropdown-${link.label.toLowerCase()}`;
            const buttonId = `nav-btn-${link.label.toLowerCase()}`;

            return link.children ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  id={buttonId}
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                  aria-controls={dropdownId}
                  onClick={() => setOpenDropdown(isDropdownOpen ? null : link.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                      e.preventDefault();
                      setOpenDropdown(true as unknown as string && link.label);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setOpenDropdown(null);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors cursor-pointer",
                    link.children.some((c) => pathname === c.href) || isDropdownOpen
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                  )}
                >
                  {link.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-150",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  id={dropdownId}
                  role="menu"
                  aria-labelledby={buttonId}
                  aria-orientation="vertical"
                  className={cn(
                    "absolute left-0 top-full w-56 pt-1.5 transition-all z-50",
                    isDropdownOpen ? "block" : "hidden"
                  )}
                >
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-1.5 shadow-xl animate-scale-in">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "block px-4 py-2 text-xs xl:text-sm transition-colors",
                          pathname === child.href
                            ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))] font-medium"
                            : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-[var(--radius)] px-2.5 py-2 text-xs xl:text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
```

#### Change 4: Workspace Pill Button Touch Target & Tabular Numerals
**Lines to Modify**: Lines 184–205

```tsx
// BEFORE:
          {/* Workspace Route Link with live badge */}
          <Link
            href="/workspace"
            className={cn(
              "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
              fileCount > 0
                ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.18)]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
            )}
            aria-label={`Open Workspace (${fileCount} files)`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspace</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                fileCount > 0
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {fileCount}
            </span>
          </Link>
```

```tsx
// AFTER:
          {/* Workspace Route Link with live badge */}
          <Link
            href="/workspace"
            className={cn(
              "inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
              fileCount > 0
                ? "border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.18)]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
            )}
            aria-label={`Open Workspace (${fileCount} files)`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Workspace</span>
            <span
              className={cn(
                "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                fileCount > 0
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {fileCount}
            </span>
          </Link>
```

---

### 3.2 `ThemeToggle.tsx`
**File Path**: `filefixer/src/components/layout/ThemeToggle.tsx`

#### Change 1: Increase Mobile Touch Target to ≥44×44px
**Lines to Modify**: Lines 54–65 and Lines 84–95

```tsx
// BEFORE:
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 opacity-50"
        aria-label="Toggle theme"
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

...

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={cycleTheme}
      className="h-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 px-2.5"
      title={`Theme: ${label} (Click to switch)`}
      aria-label={`Current theme is ${label}. Click to toggle dark, light, or system theme.`}
    >
      {icon}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
```

```tsx
// AFTER:
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 sm:h-9 sm:w-9 rounded-xl opacity-50 p-0 flex items-center justify-center cursor-pointer"
        aria-label="Toggle theme"
      >
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

...

  return (
    <Button
      variant="ghost"
      size={showLabel ? "sm" : "icon"}
      onClick={cycleTheme}
      className="h-11 w-11 sm:h-9 sm:w-9 rounded-xl transition-all hover:bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] gap-2 p-0 flex items-center justify-center cursor-pointer"
      title={`Theme: ${label} (Click to switch)`}
      aria-label={`Current theme is ${label}. Click to toggle dark, light, or system theme.`}
    >
      {icon}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
```

---

### 3.3 `CommandCenter.tsx`
**File Path**: `filefixer/src/components/command/CommandCenter.tsx`

#### Change 1: Add Focus Trap, Focus Restoration, Scroll-into-View & Body Scroll Lock
**Lines to Modify**: Lines 41–80

```tsx
// BEFORE:
export function CommandCenter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    isCommandCenterOpen,
    setCommandCenterOpen,
    files,
    setActiveFileId,
    setWorkspaceOpen,
    openSupportModal,
  } = useFileStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandCenterOpen(!isCommandCenterOpen);
      } else if (e.key === "Escape" && isCommandCenterOpen) {
        setCommandCenterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandCenterOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandCenterOpen]);
```

```tsx
// AFTER:
export function CommandCenter() {
  const router = useRouter();
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const {
    isCommandCenterOpen,
    setCommandCenterOpen,
    files,
    setActiveFileId,
    setWorkspaceOpen,
    openSupportModal,
  } = useFileStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard shortcut listener (Ctrl+K / Cmd+K) & Tab Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandCenterOpen(!isCommandCenterOpen);
        return;
      }

      if (!isCommandCenterOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setCommandCenterOpen(false);
        return;
      }

      // Tab Focus Trap
      if (e.key === "Tab" && modalContainerRef.current) {
        const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]), [href]'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandCenterOpen, setCommandCenterOpen]);

  // Manage open/close side effects: focus, body scroll lock, restore focus
  useEffect(() => {
    if (isCommandCenterOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setQuery("");
      setSelectedIndex(0);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        previousActiveElementRef.current?.focus();
      };
    }
  }, [isCommandCenterOpen]);
```

#### Change 2: Auto-scroll Selected Item into View
**Lines to Add**: After `handleKeyDown` (around Line 360)

```tsx
  // Ensure selected option scrolls into view
  useEffect(() => {
    if (!listRef.current || filteredItems.length === 0) return;
    const selectedElement = listRef.current.querySelector<HTMLElement>(
      `#command-opt-${filteredItems[selectedIndex]?.id}`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, filteredItems]);
```

#### Change 3: Modal Container Ref, Input Combobox ARIA & Clear Button ≥44px
**Lines to Modify**: Lines 365–401

```tsx
// BEFORE:
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 pt-[10vh] animate-fade-in"
      onClick={() => setCommandCenterOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Center"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[hsl(var(--border))] px-4 py-3.5 bg-[hsl(var(--background)/0.8)]">
          <Search className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to do? (e.g. compress, webp, merge pdf, under 1mb, clean)..."
            className="w-full bg-transparent text-sm sm:text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
            aria-label="Search tools, actions, files, or workflows"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-2"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            ESC
          </kbd>
        </div>
```

```tsx
// AFTER:
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6 pt-[10vh] animate-fade-in"
      onClick={() => setCommandCenterOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Center"
    >
      <div
        ref={modalContainerRef}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[hsl(var(--border))] px-4 py-3.5 bg-[hsl(var(--background)/0.8)]">
          <Search className="h-5 w-5 text-[hsl(var(--primary))] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isCommandCenterOpen}
            aria-autocomplete="list"
            aria-controls="command-results-listbox"
            aria-activedescendant={
              filteredItems[selectedIndex]
                ? `command-opt-${filteredItems[selectedIndex].id}`
                : undefined
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to do? (e.g. compress, webp, merge pdf, under 1mb, clean)..."
            className="w-full bg-transparent text-sm sm:text-base text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none"
            aria-label="Search tools, actions, files, or workflows"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors mr-1 shrink-0 cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-mono text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
            ESC
          </kbd>
        </div>
```

#### Change 4: Add role="listbox" to Container and Connected option IDs
**Lines to Modify**: Lines 404–436

```tsx
// BEFORE:
        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[hsl(var(--border)/0.5)]"
        >
          {filteredItems.length === 0 ? (
...
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--primary)/0.3)]"
                      : "hover:bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))]"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
```

```tsx
// AFTER:
        {/* Results List */}
        <div
          ref={listRef}
          id="command-results-listbox"
          role="listbox"
          aria-label="Command suggestions"
          className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[hsl(var(--border)/0.5)]"
        >
          {filteredItems.length === 0 ? (
...
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  id={`command-opt-${item.id}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--primary)/0.3)]"
                      : "hover:bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))]"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
```

---

### 3.4 `MobileBottomNav.tsx`
**File Path**: `filefixer/src/components/layout/MobileBottomNav.tsx`

#### Change 1: High-Contrast Active Indicator, Accent Bars, aria-current, and tabular-nums
**Lines to Modify**: Lines 20–105

```tsx
// BEFORE:
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.95)] backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Link>

        {/* Workspace */}
        <Link
          href="/workspace"
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/workspace"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          aria-label={`Workspace (${fileCount} files)`}
        >
          <div className="relative">
            <FolderKanban className="h-5 w-5" />
            {fileCount > 0 && (
              <span
                className={cn(
                  "absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-xs",
                  doneCount > 0 ? "bg-emerald-500" : "bg-[hsl(var(--primary))]"
                )}
              >
                {fileCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium leading-none">Workspace</span>
        </Link>

        {/* Command Center Modal Button */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] transition-colors"
          aria-label="Open Universal Command Center"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold leading-none">Search</span>
        </button>

        {/* All Tools */}
        <Link
          href="/tools"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/tools"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Tools</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          className={cn(
            "flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors",
            pathname === "/history"
              ? "text-[hsl(var(--primary))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          <Clock className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">History</span>
        </Link>
      </div>
    </nav>
```

```tsx
// AFTER:
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.96)] backdrop-blur-md pb-safe lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-1">
        {/* Home */}
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer",
            pathname === "/"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <Home className="h-5 w-5" />
          <span className="text-[10px] leading-none">Home</span>
        </Link>

        {/* Workspace */}
        <Link
          href="/workspace"
          aria-current={pathname === "/workspace" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer",
            pathname === "/workspace"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
          aria-label={`Workspace (${fileCount} files)`}
        >
          {pathname === "/workspace" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <div className="relative">
            <FolderKanban className="h-5 w-5" />
            {fileCount > 0 && (
              <span
                className={cn(
                  "absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-xs tabular-nums",
                  doneCount > 0 ? "bg-emerald-500" : "bg-[hsl(var(--primary))]"
                )}
              >
                {fileCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none">Workspace</span>
        </Link>

        {/* Command Center Modal Button */}
        <button
          type="button"
          onClick={() => setCommandCenterOpen(true)}
          className="flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
          aria-label="Open Universal Command Center"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
            <Search className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold leading-none">Search</span>
        </button>

        {/* All Tools */}
        <Link
          href="/tools"
          aria-current={pathname === "/tools" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer",
            pathname === "/tools"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/tools" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] leading-none">Tools</span>
        </Link>

        {/* History */}
        <Link
          href="/history"
          aria-current={pathname === "/history" ? "page" : undefined}
          className={cn(
            "relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer",
            pathname === "/history"
              ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary)/0.08)]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          {pathname === "/history" && (
            <span className="absolute top-1 h-0.5 w-5 rounded-full bg-[hsl(var(--primary))]" aria-hidden="true" />
          )}
          <Clock className="h-5 w-5" />
          <span className="text-[10px] leading-none">History</span>
        </Link>
      </div>
    </nav>
```

---

### 3.5 `Footer.tsx`
**File Path**: `filefixer/src/components/layout/Footer.tsx`

#### Change 1: Coordinate Bottom Padding with Safe-Area Inset
**Lines to Modify**: Line 9

```tsx
// BEFORE:
export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] pb-20 md:pb-0">
```

```tsx
// AFTER:
export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
```

---

## 4. Independent Verification & Testing Protocol

To independently verify these implementation recommendations without errors:

### 4.1 Static TypeScript & Build Verification
Execute within `filefixer/`:
```bash
npm run build --prefix filefixer
```
**Criteria for Pass**:
- Exit code must be `0`.
- All 33 Next.js routes must build statically without syntax or typing errors.
- Zero Turbopack/PostCSS warnings regarding CSS selectors or ARIA roles.

### 4.2 Accessibility & Keyboard Focus Trapping Verification
1. **Focus Trap Test**:
   - Open `/` in browser.
   - Press `Ctrl + K` or click the search trigger to open `CommandCenter`.
   - Verify initial focus lands on the search `<input>`.
   - Repeatedly press `Tab`. Verify focus cycles exclusively between `<input>`, clear button (if text entered), and the results list buttons. Focus must never escape to underlying header or page elements.
   - Press `Shift + Tab` from the first element: verify focus loops to the last element in the modal.
   - Press `Esc`: verify the modal closes and focus returns to the search trigger button.
2. **Combobox ARIA Inspection**:
   - Inspect the DOM when `CommandCenter` is open using browser DevTools.
   - Verify `<input>` has `role="combobox"`, `aria-expanded="true"`, `aria-controls="command-results-listbox"`, and `aria-activedescendant`.
   - Verify `<div id="command-results-listbox">` has `role="listbox"`.
   - Verify children have `role="option"` with IDs matching `aria-activedescendant`.
3. **Dropdown Disclosure Test**:
   - Tab to `Studios`, `Images`, or `PDF` in `Header`.
   - Verify `<button>` has `aria-haspopup="menu"` and `aria-expanded="false"`.
   - Press `Enter` or `Space`: verify dropdown opens and `aria-expanded="true"`.
   - Press `Esc`: verify dropdown closes and `aria-expanded="false"`.

### 4.3 Mobile Touch Target Verification
1. Set Chrome DevTools device mode to iPhone 14 (390×844px) or Android Pixel 7 (412×915px).
2. Measure bounding boxes with DevTools element inspector:
   - Header Search Trigger: bounding height ≥ 44px (`min-h-[44px]`).
   - Header ThemeToggle: bounding width ≥ 44px, height ≥ 44px (`44×44px`).
   - Header Workspace Link: bounding height ≥ 44px (`min-h-[44px]`).
   - CommandCenter Clear Button: bounding width ≥ 44px, height ≥ 44px (`44×44px`).
   - MobileBottomNav Tabs: bounding height = 48px (`min-h-[48px]`).
3. Scroll to the very bottom of the homepage or `/tools`:
   - Verify that the footer developer credit ("Developed by Manish Meena") and copyright line are fully visible above the fixed bottom navigation with at least 16–24px of clear padding, and not occluded on any mobile viewport.

---

## 5. Summary of Affected Files

| Component File | Primary Modifications | Standards Met |
|---|---|---|
| `filefixer/src/components/layout/Header.tsx` | Dropdown ARIA (`aria-haspopup`, `aria-expanded`), keydown handlers, click-outside listener, search trigger ≥44px, mobile drawer body scroll lock | WCAG 2.1 AA (4.1.2), Apple HIG (44px) |
| `filefixer/src/components/layout/ThemeToggle.tsx` | Touch target expansion `h-11 w-11 sm:h-9 sm:w-9` for interactive and skeleton states | Apple HIG / Android Material (≥44px) |
| `filefixer/src/components/command/CommandCenter.tsx` | Tab focus trap, focus restoration, body scroll lock, `role="listbox"` / `combobox` / `option` hierarchy, clear button ≥44px | W3C ARIA Combobox 1.2, WCAG 2.1 AA (2.1.2) |
| `filefixer/src/components/layout/MobileBottomNav.tsx` | Active accent indicator, `aria-current="page"`, `.tabular-nums` on badge | WCAG 2.1 AA, UI-UX-Pro-Max |
| `filefixer/src/components/layout/Footer.tsx` | Safe-area coordinated padding `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0` | Apple HIG Safe Area, Zero Occlusion |
