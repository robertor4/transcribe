# Dark Mode Feature Plan (Lightweight Implementation)

**Status**: In Progress
**Priority**: Medium
**Created**: October 2025
**Updated**: October 2025
**Epic**: User Experience Enhancement
**Implementation Strategy**: Lightweight (CSS Variables + useTheme Hook)

---

## Feature Overview

### User Story

As a professional who uses Neural Summary for extended periods (e.g., reviewing transcripts, editing summaries, or analyzing communication),
I want the option to switch to a Dark Mode interface,
so that I can reduce eye strain, improve readability in low-light environments, and personalize my workspace experience.

### Business Value

- **User Satisfaction**: Addresses common user request for dark mode in productivity tools
- **Accessibility**: Reduces eye strain for users working in low-light environments
- **Modern UX**: Aligns with industry standards (most SaaS tools now offer dark mode)
- **Retention**: Improves user experience for extended session durations
- **Differentiation**: Professional appearance with theme customization
- **Fast Delivery**: Lightweight approach enables 4-6 hour implementation vs 22-33 hours for full enterprise solution

---

## Acceptance Criteria

| # | Criterion | Description | Status |
|---|-----------|-------------|--------|
| 1 | Toggle Option Available | A visible toggle in the user settings menu allows users to switch between light, dark, and system modes. | ✅ Included |
| 2 | Automatic Detection | Dark mode automatically applies if the user's system or browser prefers dark color schemes (`prefers-color-scheme: dark`). | ✅ Included |
| 3 | Persistent Preference | User's theme choice is saved via localStorage and applied across sessions. | ✅ localStorage only |
| 4 | Accessibility Compliant | All colors meet WCAG 2.1 AA contrast standards. Ensure high readability for text, buttons, and charts. | ✅ Included |
| 5 | Smooth Transition | Implement a smooth fade when toggling themes via CSS transitions. | ✅ Included |
| 6 | Consistent Design | Apply dark mode to high-impact pages: dashboard, upload interface, transcript view, analysis results, and settings. | ⚠️ Top 10 components only |
| 7 | Charts & Visuals Adaptation | Charts, graphs, and timelines automatically adjust to dark mode colors. | ✅ Included |

**Note**: Cross-device sync via Firestore is deferred to future enhancement. localStorage provides session persistence on the same device.

---

## Technical Analysis

### Current Architecture

Based on thorough codebase exploration, the application is **excellently positioned** for lightweight dark mode:

**Key Discovery**:
- ✅ `apps/web/app/globals.css` **already has dark mode CSS variables** defined (lines 30-48)
- ✅ Uses `@media (prefers-color-scheme: dark)` for automatic OS preference detection
- ✅ Tailwind CSS v4 with plugin system ready for dark mode

**Existing CSS Variables**:

Light mode (default):
```css
--color-primary: #cc3399
--color-text-primary: #111827 (gray-900)
--color-text-secondary: #374151 (gray-700)
--color-text-muted: #6b7280 (gray-500)
```

Dark mode (already defined!):
```css
--background: #0a0a0a
--foreground: #ededed
--color-text-primary: #f9fafb (gray-50)
--color-text-secondary: #e5e7eb (gray-200)
--color-text-muted: #9ca3af (gray-400)
```

### Scope of Work (Lightweight Approach)

**What We're Building**:
- ✅ Manual theme toggle (light/dark/system)
- ✅ OS preference detection and respect
- ✅ localStorage persistence
- ✅ Smooth CSS transitions
- ✅ Top 10 high-impact components
- ✅ Extended CSS variables for comprehensive color system

**What We're Deferring**:
- ❌ Backend API changes (no user.service.ts modifications)
- ❌ Firestore user schema updates (no cross-device sync)
- ❌ Shared types package updates
- ❌ Context Provider (using simple hook instead)
- ❌ Full component coverage (focusing on top 10 for MVP)

**Statistics**:
- **10 React components** to update (high-impact only)
- **~40-50 instances** of hardcoded colors in top components
- **1 new hook** (useTheme.ts)
- **1 settings UI section** (theme selector)
- **No backend changes**

---

## Implementation Plan (Lightweight)

### Phase 1: CSS Foundation (1 hour)

#### 1.1 Extend CSS Variables & Enable Manual Control
**File**: `apps/web/app/globals.css`

**Tasks**:
1. **Modify media query** to support manual override:
   ```css
   /* Change from: */
   @media (prefers-color-scheme: dark) {
     :root { ... }
   }

   /* To: */
   @media (prefers-color-scheme: dark) {
     :root:not(.light-mode) { ... }
   }
   ```

2. **Add `.dark-mode` class** with same dark theme variables:
   ```css
   .dark-mode {
     --background: #0a0a0a;
     --foreground: #ededed;
     --color-primary: #cc3399;
     --color-text-primary: #f9fafb;
     --color-text-secondary: #e5e7eb;
     --color-text-muted: #9ca3af;
     --color-placeholder: #6b7280;
   }
   ```

3. **Expand CSS variables** for backgrounds, borders, shadows:
   ```css
   :root {
     /* Backgrounds */
     --bg-main: #ffffff;
     --bg-card: #f9fafb;
     --bg-elevated: #ffffff;

     /* Borders */
     --border-default: #d1d5db;
     --border-subtle: #e5e7eb;

     /* Shadows */
     --shadow-sm: rgba(0, 0, 0, 0.05);
     --shadow-md: rgba(0, 0, 0, 0.1);
   }

   .dark-mode {
     --bg-main: #0a0a0a;
     --bg-card: #1f2937;
     --bg-elevated: #374151;

     --border-default: #374151;
     --border-subtle: #4b5563;

     --shadow-sm: rgba(0, 0, 0, 0.3);
     --shadow-md: rgba(0, 0, 0, 0.5);
   }
   ```

4. **Update `.prose` styles** for markdown content:
   ```css
   .prose p {
     color: #1f2937 !important; /* gray-800 */
   }

   .dark-mode .prose p {
     color: #e5e7eb !important; /* gray-200 */
   }

   .prose h1, .prose h2, .prose h3 {
     color: #111827 !important; /* gray-900 */
   }

   .dark-mode .prose h1,
   .dark-mode .prose h2,
   .dark-mode .prose h3 {
     color: #f9fafb !important; /* gray-50 */
   }
   ```

5. **Add smooth transitions**:
   ```css
   * {
     transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
   }
   ```

---

### Phase 2: Theme Hook (15 minutes)

#### 2.1 Create useTheme Hook
**File**: `apps/web/hooks/useTheme.ts` (NEW)

**Implementation**:
```typescript
'use client';
import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load saved theme from localStorage
    const saved = (localStorage.getItem('theme') as ThemeMode) || 'system';
    setThemeState(saved);
    applyTheme(saved);

    // Listen to OS preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (saved === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode');

    if (mode === 'light') {
      root.classList.add('light-mode');
    } else if (mode === 'dark') {
      root.classList.add('dark-mode');
    } else {
      // System mode - respect OS preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-mode');
      } else {
        root.classList.add('light-mode');
      }
    }
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return { theme: 'system', setTheme: () => {} };
  }

  return { theme, setTheme };
}
```

---

### Phase 3: Settings UI (30 minutes)

#### 3.1 Add Theme Selector to Settings
**File**: `apps/web/app/[locale]/settings/preferences/page.tsx`

**Implementation**:
1. Import useTheme hook
2. Add theme selector section (similar to language preference)
3. Use radio buttons or styled cards for 3 options

**UI Pattern**:
```tsx
'use client';
import { useTheme } from '@/hooks/useTheme';

export default function PreferencesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Existing language preference... */}

      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Theme
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred color scheme
        </p>

        <div className="grid grid-cols-3 gap-4">
          <ThemeCard
            value="light"
            label="Light"
            icon="☀️"
            selected={theme === 'light'}
            onClick={() => setTheme('light')}
          />
          <ThemeCard
            value="dark"
            label="Dark"
            icon="🌙"
            selected={theme === 'dark'}
            onClick={() => setTheme('dark')}
          />
          <ThemeCard
            value="system"
            label="System"
            icon="💻"
            selected={theme === 'system'}
            onClick={() => setTheme('system')}
          />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ value, label, icon, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all
        ${selected
          ? 'border-[#cc3399] bg-pink-50 dark:bg-pink-900/20'
          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
        hover:border-[#cc3399] hover:bg-pink-50 dark:hover:bg-pink-900/10
      `}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </div>
    </button>
  );
}
```

---

### Phase 4: Component Updates (2-3 hours)

#### 4.1 High-Impact Components (Top 10)

Update these components with `dark:` variant classes:

1. **`apps/web/components/FileUploader.tsx`**
   - Drag-drop area: `bg-gray-50 dark:bg-gray-800`
   - Border: `border-gray-300 dark:border-gray-700`
   - Text: `text-gray-700 dark:text-gray-300`
   - Input placeholders: `placeholder:text-gray-500 dark:placeholder:text-gray-400`

2. **`apps/web/components/UserProfileMenu.tsx`**
   - Dropdown background: `bg-white dark:bg-gray-800`
   - Menu items: `hover:bg-gray-100 dark:hover:bg-gray-700`
   - Text: `text-gray-700 dark:text-gray-300`
   - Dividers: `border-gray-200 dark:border-gray-700`

3. **`apps/web/components/TranscriptionList.tsx`**
   - List item background: `bg-white dark:bg-gray-800`
   - Hover state: `hover:bg-gray-50 dark:hover:bg-gray-700`
   - Text: `text-gray-900 dark:text-gray-100`
   - Subtitle: `text-gray-600 dark:text-gray-400`

4. **`apps/web/components/AnalysisTabs.tsx`**
   - Tab background: `bg-white dark:bg-gray-800`
   - Active tab: `border-[#cc3399]` (same)
   - Content area: Already handled by `.prose` styles in globals.css
   - Markdown: Relies on CSS variables

5. **`apps/web/components/ShareModal.tsx`**
   - Modal background: `bg-white dark:bg-gray-800`
   - Overlay: `bg-black/50 dark:bg-black/70`
   - Form inputs: `bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200`
   - QR code background: Conditional based on theme

6. **`apps/web/components/LanguageSwitcher.tsx`**
   - Dropdown: `bg-white dark:bg-gray-800`
   - Options: `hover:bg-gray-100 dark:hover:bg-gray-700`

7. **`apps/web/components/ActionItemsTable.tsx`**
   - Table header: `bg-gray-50 dark:bg-gray-900`
   - Rows: `border-gray-200 dark:border-gray-700`
   - Text: `text-gray-900 dark:text-gray-100`

8. **`apps/web/components/MobileNav.tsx`**
   - Navigation: `bg-white dark:bg-gray-900`
   - Menu items: `text-gray-700 dark:text-gray-300`

9. **`apps/web/app/[locale]/dashboard/page.tsx`**
   - Page background: Already handled by body styles
   - Card backgrounds: `bg-white dark:bg-gray-800`
   - Headers: `text-gray-900 dark:text-gray-100`

10. **`apps/web/app/[locale]/settings/page.tsx`**
    - Settings layout: `bg-gray-50 dark:bg-gray-900`
    - Card backgrounds: `bg-white dark:bg-gray-800`

#### 4.2 Color Class Replacement Pattern

| Current (Light Only) | Updated (Light + Dark) |
|---------------------|------------------------|
| `bg-white` | `bg-white dark:bg-gray-800` |
| `bg-gray-50` | `bg-gray-50 dark:bg-gray-900` |
| `bg-gray-100` | `bg-gray-100 dark:bg-gray-800` |
| `text-gray-700` | `text-gray-700 dark:text-gray-300` |
| `text-gray-900` | `text-gray-900 dark:text-gray-100` |
| `text-gray-600` | `text-gray-600 dark:text-gray-400` |
| `border-gray-300` | `border-gray-300 dark:border-gray-700` |
| `border-gray-200` | `border-gray-200 dark:border-gray-600` |

#### 4.3 Input Field Pattern (Critical)

Always include text and placeholder colors:

```tsx
<input
  className="
    px-3 py-2 rounded-lg
    border border-gray-400 dark:border-gray-600
    bg-white dark:bg-gray-800
    text-gray-800 dark:text-gray-200
    placeholder:text-gray-500 dark:placeholder:text-gray-400
    focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20
  "
  placeholder="Enter text..."
/>
```

---

### Phase 5: Testing & Polish (1 hour)

#### 5.1 Functional Testing

- [ ] System dark mode preference detected on first load
- [ ] Manual toggle overrides system preference
- [ ] Theme persists after page reload (localStorage)
- [ ] Theme applies consistently across visited pages
- [ ] No flash of wrong theme on page load
- [ ] Smooth transitions when toggling themes

#### 5.2 Accessibility Testing

- [ ] All text meets WCAG 2.1 AA contrast ratios (4.5:1 minimum)
- [ ] Button states clearly distinguishable
- [ ] Form inputs have sufficient contrast
- [ ] Focus indicators visible in both modes
- [ ] Keyboard navigation works in both modes

#### 5.3 Cross-Browser Testing

- [ ] Chrome - OS preference detection works
- [ ] Firefox - OS preference detection works
- [ ] Safari - OS preference detection works
- [ ] Edge - OS preference detection works

#### 5.4 Visual Testing

- [ ] Dashboard page
- [ ] Upload interface (FileUploader component)
- [ ] Transcript view (AnalysisTabs with markdown)
- [ ] Settings pages
- [ ] User menu dropdown
- [ ] Modals (ShareModal)
- [ ] Forms and inputs
- [ ] Tables (ActionItemsTable)

---

## Key Files to Modify

### Frontend Only (No Backend Changes)

| File | Purpose | Changes | Priority |
|------|---------|---------|----------|
| `apps/web/app/globals.css` | Global styles & CSS variables | Expand dark mode variables, update prose, add transitions | High |
| `apps/web/hooks/useTheme.ts` | Theme state management | **CREATE NEW** - Simple hook with localStorage | High |
| `apps/web/app/[locale]/settings/preferences/page.tsx` | Settings UI | Add theme selector (Light/Dark/System) | High |
| `apps/web/components/FileUploader.tsx` | Upload interface | Add dark: classes | High |
| `apps/web/components/UserProfileMenu.tsx` | User menu | Add dark: classes | High |
| `apps/web/components/TranscriptionList.tsx` | Transcript list | Add dark: classes | High |
| `apps/web/components/AnalysisTabs.tsx` | Analysis display | Add dark: classes | High |
| `apps/web/components/ShareModal.tsx` | Share modal | Add dark: classes | Medium |
| `apps/web/components/LanguageSwitcher.tsx` | Language selector | Add dark: classes | Medium |
| `apps/web/components/ActionItemsTable.tsx` | Action items | Add dark: classes | Medium |
| `apps/web/components/MobileNav.tsx` | Mobile navigation | Add dark: classes | Medium |
| `apps/web/app/[locale]/dashboard/page.tsx` | Dashboard page | Add dark: classes | High |
| `apps/web/app/[locale]/settings/page.tsx` | Settings layout | Add dark: classes | Medium |

---

## Color System

### Brand Colors (Consistent Across Themes)

```css
--color-primary: #cc3399 (same in both modes)
```

### Text Hierarchy

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary text (headers) | `#111827` (gray-900) | `#f9fafb` (gray-50) |
| Secondary text (body) | `#374151` (gray-700) | `#e5e7eb` (gray-200) |
| Tertiary text (hints) | `#6b7280` (gray-500) | `#9ca3af` (gray-400) |
| Placeholder | `#9ca3af` (gray-400) | `#6b7280` (gray-500) |

### Background Hierarchy

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Main background | `#ffffff` | `#0a0a0a` |
| Card/panel | `#f9fafb` (gray-50) | `#1f2937` (gray-800) |
| Elevated/modal | `#ffffff` | `#374151` (gray-700) |

### Borders & Dividers

| Purpose | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Default border | `#d1d5db` (gray-300) | `#374151` (gray-700) |
| Subtle border | `#e5e7eb` (gray-200) | `#4b5563` (gray-600) |

---

## Estimated Effort (Lightweight)

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| Phase 1 | CSS Foundation (variables, prose, transitions) | 1 hour |
| Phase 2 | useTheme Hook | 15 minutes |
| Phase 3 | Settings UI | 30 minutes |
| Phase 4 | Component Updates (top 10) | 2-3 hours |
| Phase 5 | Testing & Polish | 1 hour |
| **Total** | **Lightweight Implementation** | **4-6 hours** |

**Time Savings**: 80% faster than full enterprise plan (22-33 hours)

---

## Comparison: Lightweight vs Full Plan

| Feature | Lightweight (4-6h) | Full Plan (22-33h) |
|---------|-------------------|-------------------|
| Manual Theme Toggle | ✅ | ✅ |
| OS Preference Detection | ✅ | ✅ |
| localStorage Persistence | ✅ | ✅ |
| Cross-Device Sync (Firestore) | ❌ | ✅ |
| Backend API Changes | ❌ | ✅ |
| Component Coverage | Top 10 (80% impact) | All 28+ |
| Context Provider | ❌ (hook only) | ✅ |
| Smooth Transitions | ✅ | ✅ |
| Accessibility | ✅ | ✅ |

---

## Future Enhancements

When ready to upgrade to full enterprise solution:

1. **Cross-Device Sync** (add ~4-6 hours):
   - Add `themeMode` to `packages/shared/src/types.ts` User interface
   - Create `PUT /user/theme-preference` endpoint in backend
   - Update `apps/web/lib/user-preferences.ts` with API call
   - Modify useTheme hook to sync with Firestore on theme change

2. **Full Component Coverage** (~4-6 hours):
   - Update remaining 18 components
   - Search and replace all hardcoded color classes

3. **Advanced Features**:
   - Theme scheduling (auto-switch based on time of day)
   - Custom color themes
   - High contrast mode
   - Per-device theme preferences

---

## Implementation Notes

### Critical Success Factors

1. **Leverage Existing CSS**: 30% of dark mode already implemented in globals.css
2. **Simple State**: localStorage + DOM class manipulation (no complex state)
3. **Focused Scope**: Top 10 components cover 80% of user interactions
4. **Smooth UX**: CSS transitions provide polished feel
5. **Easy to Expand**: Can upgrade to full sync later without refactoring

### Why This Approach Works

- **Existing Foundation**: Dark mode CSS variables already defined
- **Tailwind v4**: Built-in dark mode support via class strategy
- **Proven Pattern**: Simple hook pattern used across Next.js community
- **80/20 Rule**: Top 10 components provide majority of UX impact
- **Future-Proof**: Easy path to add backend sync when needed

### Potential Risks & Mitigations

1. **Risk**: Missing hardcoded colors in updated components
   - **Mitigation**: Systematic search for `bg-`, `text-`, `border-` patterns

2. **Risk**: Third-party libraries (QR code, markdown) not supporting dark mode
   - **Mitigation**: Test early, add wrapper divs with background if needed

3. **Risk**: Flash of wrong theme on page load
   - **Mitigation**: useTheme hook has hydration guard (`mounted` state)

---

## References

### Related Files

**Planning Documents**:
- `docs/SHARING_FEATURE_PLAN.md` - Sharing feature planning
- `docs/MOBILE_OPTIMIZATION_PLAN.md` - Mobile optimization planning
- `CLAUDE.md` - Project guidelines and UI design rules

**Key Implementation Files**:
- `apps/web/app/globals.css` - Already has dark mode CSS variables!
- `apps/web/components/LanguageSwitcher.tsx` - Reference for preference UI pattern

### External Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Next.js Dark Mode Best Practices](https://nextjs.org/docs/app/building-your-application/styling/css-variables)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Last Updated**: October 2025
**Document Version**: 2.0 (Lightweight)
**Status**: In Progress
**Implementation Time**: 4-6 hours (80% faster than full plan)
