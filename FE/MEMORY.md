# 🗂️ FRONTEND MEMORY — QR-Home System
> **Project Goal**: A multi-store QR Menu system for Spas/Restaurants with high-quality themes and real-time admin preview.
> **Last Updated**: 2026-04-29
> **Status**: Modularized & Refactored (Container-Component-Composable pattern)

---

## 🛠️ Tech Stack

- **Core**: Vue 3.5 (Composition API, `<script setup>`, TypeScript)
- **Build**: Vite 8 + TailwindCSS v4 (`@tailwindcss/vite`)
- **State**: Pinia (Auth, Store Management)
- **Data**: TanStack Query v5 (Server state, caching, auto-refetch)
- **Routing**: Vue Router 4
- **i18n**: vue-i18n (Supported: EN, VI, DE)
- **Icons**: Lucide Vue Next
- **Utils**: Axios, @vueuse/core, clsx, tailwind-merge

---

## 🏗️ Architecture & Patterns

### 1. Container-Component-Composable (C3)
The project follows a strict separation of concerns:
- **Composables**: All business logic, API calls (via TanStack Query), and reactive state logic.
- **Containers**: Page-level components (e.g., `MenuPage.vue`, `DashboardPage.vue`) that connect composables to UI.
- **Components**: Pure UI components or theme-specific implementations.

### 2. Theme System
Each customer theme is a standalone Vue component located in `src/views/customer/themes/`.
- `MenuPage.vue` acts as the orchestrator.
- Props are passed to themes (categories, services, config).
- Styling is dynamic based on `customerInterfaceStyle` config.

### 3. Admin Preview System
Live preview in the Admin Dashboard:
- `ThemeSettingsPage.vue` opens `MenuPage.vue` in an `<iframe>`.
- Data is synced via `sessionStorage` (Admin Preview Session) to avoid constant API hits during customization.
- `useMenuData` prioritizes preview data if `isAdminPreview` is active.

### 4. Multi-Store Architecture
- `store-manager.store.ts` tracks `currentStoreId`.
- Routes use `:id` (storeId) for customer access: `/menu/:id`.
- Admin switches stores → Pinia updates → Query keys invalidate → Data re-fetches automatically.

---

## 📁 Directory Structure

```text
FE/
├── src/
│   ├── api/                # Axios instances & API modules (auth, services, etc.)
│   ├── assets/             # Images, fallback assets, logos
│   ├── composables/        # ★ Core Business Logic (useMenuData, useThemeConfig, etc.)
│   ├── constants/          # Theme constants, font options, UI sizes
│   ├── i18n/               # Localization files (en, vi, de)
│   ├── layouts/            # AdminLayout, CustomerLayout
│   ├── lib/                # Shared libraries (QueryClient, AuthStorage)
│   ├── router/             # Vue Router configuration & guards
│   ├── stores/             # Pinia stores (auth, store-manager)
│   ├── types/              # TypeScript interfaces (API, Models)
│   ├── utils/              # Utility functions (image error handling, formatting)
│   ├── views/
│   │   ├── admin/          # Admin Dashboard pages & components
│   │   └── customer/       # Customer-facing Menu & Themes
│   ├── App.vue             # Root component with dynamic layouts
│   ├── main.ts             # App initialization
│   └── style.css           # Tailwind v4 globals & design tokens
└── ...config files         # vite, tsconfig, docker, etc.
```

---

## 🔑 Key Files & Modules

| Module | Purpose |
|--------|---------|
| `src/views/customer/MenuPage.vue` | The "Heart" of the customer interface. |
| `src/composables/useMenuData.ts` | Fetches/Manages all menu-related data & preview logic. |
| `src/utils/image.utils.ts` | Centralized image error handling (`handleImgError`). |
| `src/style.css` | Design tokens, glassmorphism, and global animations. |
| `src/api/client.ts` | Axios instance with JWT & 401 interceptors. |

---

## 🔄 Recent Major Changes (Refactoring Log)

- **MenuPage Modularization**: Decoupled a 2000+ line monolith into 9 themes and 6+ composables.
- **Image Handling**: Moved all image fallback logic to `image.utils.ts`.
- **Global Styles**: Centralized transitions (`.slide-fade`) and scrollbar utilities in `style.css`.
- **Localization Integration**: Fully integrated `vue-i18n` into both Admin and Customer views.
- **Admin Theme Preview**: Implemented session-based live preview for the theme customizer.

---

## ⚠️ Known Issues & TODOs

- [ ] **Technical Debt**:
    - Tách `useAdminPreview.ts` riêng khỏi `useMenuData.ts`.
    - Replace `any` types in `SpaConfig`.
    - Improve `useMenuBadge` dependency injection.
- [ ] **Features**:
    - Add Search Debounce (currently realtime).
    - Implement Toast Notifications (currently using native alerts in some places).
    - Add Dark Mode support for Admin Dashboard.
- [ ] **Testing**:
    - Setup Vitest for unit testing composables.
    - Setup Playwright for critical path E2E testing.

---

## 📖 Notes for Models
- When editing **Customer Themes**, check `src/style.css` for existing design tokens.
- When adding **Business Logic**, create a new composable in `src/composables/`.
- Always use `rtk` prefix for shell commands as per project rules.
- Follow the **Container-Component-Composable** pattern for all new features.
