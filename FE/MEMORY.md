# 🗂️ FRONTEND MEMORY — QR-Home Generation System

> **File này dùng để review lại toàn bộ những gì đã làm ở phía Frontend.**
> **Cập nhật lần cuối:** 2026-04-01

---

## 📋 Tổng quan

- **Framework:** Vue 3.5 + TypeScript (Composition API, `<script setup>`)
- **Build Tool:** Vite 8
- **Styling:** TailwindCSS v4 (plugin-based, `@tailwindcss/vite`)
- **State:** Pinia (auth store)
- **Data Fetching:** TanStack Query v5 (Vue)
- **HTTP Client:** Axios
- **Router:** Vue Router 4
- **Icons:** Lucide Vue Next
- **UI Components:** radix-vue + class-variance-authority + clsx + tailwind-merge
- **Port:** 5173 (dev), 80 (Docker/Nginx)

---

## 📁 Cấu trúc thư mục

```
FE/
├── .env                          # (empty — chỉ cần cho production override)
├── .gitignore
├── .dockerignore
├── Dockerfile                    # Multi-stage: Vite build + Nginx (SPA fallback + API proxy)
├── index.html                    # Google Fonts (Inter, Manrope), mobile viewport, SEO meta
├── vite.config.ts                # TailwindCSS plugin, @ alias, API proxy /api → :3000
├── tsconfig.json
├── tsconfig.app.json             # paths: @/* → src/*, strict mode
├── tsconfig.node.json
├── package.json                  # name: qr-home-fe
│
├── public/
│   └── vite.svg
│
└── src/
    ├── main.ts                   # createApp → Pinia + VueQueryPlugin + Router
    ├── App.vue                   # Dynamic layout: admin / customer / blank
    ├── style.css                 # TailwindCSS v4 globals + design tokens + custom utilities
    │
    ├── lib/
    │   └── utils.ts              # cn(), formatPrice(), formatDate(), truncate()
    │
    ├── types/                    # TypeScript interfaces
    │   ├── api.types.ts          # ApiResponse<T>, PaginatedResponse<T>
    │   ├── category.types.ts     # Category, CreateCategoryPayload, UpdateCategoryPayload
    │   ├── service.types.ts      # Service, CreateServicePayload, UpdateServicePayload, ServiceQuery
    │   ├── qr-config.types.ts    # QrConfig, QrStatus
    │   └── traffic.types.ts      # TrafficDay, MostViewedService, GrowthData, DashboardData, TopViewedItem
    │
    ├── api/                      # Axios API clients (typed)
    │   ├── client.ts             # Axios instance: baseURL=/api, JWT interceptor, 401 redirect
    │   ├── auth.api.ts           # login(), getProfile()
    │   ├── categories.api.ts     # getAll(), getActive(), getOne(), create(), update(), delete()
    │   ├── services.api.ts       # getAll(), getPublic(), getOne(), create(), update(), delete()
    │   ├── qr-config.api.ts      # getConfig(), getStatus(), generate(), updateStatus(), downloadQr()
    │   ├── traffic.api.ts        # logVisit(), getDashboard(), getTopViewed()
    │   └── upload.api.ts         # upload(file) — FormData multipart
    │
    ├── stores/
    │   └── auth.store.ts         # Pinia: token (localStorage), admin, login(), fetchProfile(), logout()
    │
    ├── router/
    │   └── index.ts              # Routes + auth guard (requiresAuth → redirect to login)
    │
    ├── layouts/
    │   ├── AdminLayout.vue       # Sidebar nav + top bar + responsive hamburger
    │   └── CustomerLayout.vue    # Minimal wrapper
    │
    ├── views/
    │   ├── NotFoundPage.vue      # 404 page
    │   │
    │   ├── admin/
    │   │   ├── LoginPage.vue         # ① Login
    │   │   ├── DashboardPage.vue     # ② Dashboard
    │   │   ├── CategoriesPage.vue    # ③ Categories CRUD
    │   │   ├── ServicesPage.vue       # ④ Services list
    │   │   ├── ServiceFormPage.vue    # ⑤ Service create/edit
    │   │   └── QrManagementPage.vue   # ⑥ QR management
    │   │
    │   └── customer/
    │       └── MenuPage.vue          # ⑦ Customer mobile menu
    │
    └── assets/
        └── hero.png              # Hero image (auto-generated)
```

---

## 🎨 Design System (style.css)

### Color Palette: Navy / Azure / Gold

| Token | Hex | Sử dụng |
|-------|-----|---------|
| `navy-950` | `#0a1929` | Background chính (admin sidebar, login bg) |
| `navy-900` | `#102a43` | Primary text, buttons |
| `navy-500` | `#627d98` | Muted text |
| `navy-100` | `#d9e2ec` | Borders |
| `azure-600` | `#0552b5` | Links, accent elements |
| `gold-500` | `#f0b429` | Accent chính (CTA buttons, highlights) |
| `gold-400` | `#f7c948` | Active state, badges |

### Semantic Colors
- `--color-primary`: navy-900
- `--color-accent`: gold-500
- `--color-surface`: white
- `--color-surface-dim`: #f8fafc
- `--color-text-muted`: navy-500
- `--color-border`: navy-100
- `--color-success`: #27ae60
- `--color-danger`: #e74c3c

### Typography
- **Body:** Inter (300–700)
- **Display:** Manrope (400–800)
- Loaded từ Google Fonts via `index.html`

### Custom Utilities (TailwindCSS v4 `@utility`)
- `glass` — glassmorphism background
- `text-gradient` — navy → azure gradient text
- `line-clamp-2`, `line-clamp-3` — line truncation

### Custom Shadows (`@theme`)
- `shadow-card` — subtle card shadow
- `shadow-elevated` — hover state shadow
- `shadow-popup` — modal/popup shadow

---

## 🗺️ Routes

| Path | Name | Component | Layout | Auth? |
|------|------|-----------|--------|-------|
| `/menu` | customer-menu | MenuPage.vue | customer | ❌ |
| `/admin/login` | admin-login | LoginPage.vue | blank | ❌ |
| `/admin` | — | redirect → /admin/dashboard | — | — |
| `/admin/dashboard` | admin-dashboard | DashboardPage.vue | admin | ✅ |
| `/admin/categories` | admin-categories | CategoriesPage.vue | admin | ✅ |
| `/admin/services` | admin-services | ServicesPage.vue | admin | ✅ |
| `/admin/services/new` | admin-service-create | ServiceFormPage.vue | admin | ✅ |
| `/admin/services/:id/edit` | admin-service-edit | ServiceFormPage.vue | admin | ✅ |
| `/admin/qr` | admin-qr | QrManagementPage.vue | admin | ✅ |
| `/` | — | redirect → /menu | — | — |
| `/:pathMatch(.*)*` | not-found | NotFoundPage.vue | blank | ❌ |

**Auth Guard:** Route có `meta.requiresAuth` → kiểm tra `authStore.isAuthenticated` → redirect `/admin/login`

---

## 📄 Trang chi tiết

### ① LoginPage.vue
- **UI:** Glassmorphism card trên nền gradient navy, decorative blur orbs
- **Logic:** username + password → `authStore.login()` → redirect
- **UX:** Toggle show/hide password, loading spinner, error message
- **Responsive:** Full-screen centered, padding tự co

### ② DashboardPage.vue
- **Welcome banner:** Gradient navy + tên admin
- **Stats cards (3):** Total Views, Today vs Yesterday (growth %), Most Viewed Service
- **Weekly chart:** 7-day bar chart (CSS bars, không dùng thư viện chart)
- **Data:** TanStack Query → `trafficApi.getDashboard()`, auto refetch 30s
- **Responsive:** Grid 1→2→3 cols

### ③ CategoriesPage.vue
- **CRUD table:** Name, Slug, Sort Order, Status, Actions (edit/delete)
- **Modal form:** Create/edit category, auto-generate slug từ name
- **TanStack Query:** `useQuery` cho list, `useMutation` cho create/update/delete → `invalidateQueries`
- **Confirm delete:** Browser confirm dialog

### ④ ServicesPage.vue
- **Filter bar:** Search (text), Category (select), Status (select)
- **Data table:** Image, Name (+ short desc), Category, Price, Labels (badges), Status, Actions
- **Pagination:** Previous/Next + showing X to Y of Z
- **Labels:** Best Seller (gold), New (azure), Combo (purple) — badge chips
- **TanStack Query:** Reactive query (search/filter thay đổi → auto refetch)

### ⑤ ServiceFormPage.vue
- **Dual-purpose:** Create (route: `/admin/services/new`) + Edit (route: `/admin/services/:id/edit`)
- **Image upload:** Preview thumbnail, `uploadApi.upload()` → set imageUrl
- **Fields:** Category select, Name, Short desc, Full desc (textarea), Price + Currency, Labels (checkboxes), Sort order
- **onMounted:** Nếu edit → load service data vào form
- **Save:** `useMutation` → create() hoặc update() → redirect `/admin/services`

### ⑥ QrManagementPage.vue
- **Status card:** Current status (active/paused/inactive) + dot indicator + color-coded
- **URL display:** Hiện qrUrl nếu đã generate
- **Actions:** Generate/Re-Generate, Pause/Resume, Download QR Image
- **Business rule errors:** Hiện error message từ API (ví dụ: no active services)
- **Info box:** Hướng dẫn sử dụng

### ⑦ MenuPage.vue (Customer — Mobile-first)
- **QR Guard:** onMounted check `qrConfigApi.getStatus()` → nếu !== 'active' → show "Menu Unavailable"
- **Hero section:** Gradient navy, tên spa + search bar
- **Category tabs:** Horizontal scroll (sticky top), All + dynamic categories
- **Service cards:** Image (lazy load) + labels (star, NEW badge) + name + short desc + price
- **Bottom sheet detail:** Teleport, Transition animation, full image + labels overlay + full description
- **Traffic logging:** Tự động log `page_view` khi vào trang, `service_view` khi mở detail
- **CSS:** Custom no-scrollbar, sheet animation

---

## 🔌 API Client (api/client.ts)

- **Base URL:** `/api` (proxied bởi Vite dev server → `localhost:3000`)
- **Request interceptor:** Tự động attach `Bearer {token}` từ `localStorage('qr_home_token')`
- **Response interceptor:** 401 → xóa token + redirect `/admin/login`

---

## 🗄️ Auth Store (stores/auth.store.ts)

| Property/Method | Mô tả |
|-----------------|-------|
| `token` | JWT string, sync với localStorage |
| `admin` | `{ id, username }` hoặc null |
| `isLoading` | Loading state cho login |
| `isAuthenticated` | Computed: `!!token` |
| `login(username, password)` | Gọi API → set token + admin → return boolean |
| `fetchProfile()` | Gọi API `/auth/me` → update admin object |
| `logout()` | Clear token + admin + localStorage |

---

## ⚙️ Vite Config

```typescript
plugins: [vue(), tailwindcss()]
resolve.alias: { '@': resolve(__dirname, 'src') }
server.proxy: { '/api' → localhost:3000, '/uploads' → localhost:3000 }
```

---

## 🐳 Docker

- **Dockerfile:** Multi-stage
  - Stage 1: `npm ci` + `npm run build`
  - Stage 2: Nginx Alpine, copy `dist/`, SPA fallback config
  - Nginx proxy: `/api` → `http://backend:3000`, `/uploads` → `http://backend:3000`
- **Exposed port:** 80

---

## 📦 Dependencies chính

| Package | Version | Dùng cho |
|---------|---------|----------|
| vue | 3.5.30 | Core framework |
| vue-router | 4.6.4 | Client-side routing |
| pinia | 3.0.4 | State management |
| @tanstack/vue-query | 5.96.0 | Server state, caching, auto-refetch |
| axios | 1.14.0 | HTTP client |
| tailwindcss | 4.2.2 | Utility-first CSS |
| @tailwindcss/vite | 4.2.2 | Vite TailwindCSS plugin |
| lucide-vue-next | 1.0.0 | Icons |
| radix-vue | 1.9.17 | Headless UI primitives |
| class-variance-authority | 0.7.1 | Variant-based component styling |
| clsx + tailwind-merge | — | Class name utilities |
| @vueuse/core | 14.2.1 | Vue composition utilities |

---

## ⚠️ Lưu ý & Todo

- [ ] Chưa setup shadcn-vue components (đã install dependencies nhưng chưa init `npx shadcn-vue@latest init`)
- [ ] Customer MenuPage chưa có Article Slide (top viewed services carousel)
- [ ] Chưa có responsive test trên thiết bị thật
- [ ] Chưa có loading skeleton cho các trang
- [ ] Dashboard chart đang dùng CSS bars, chưa dùng thư viện chart (chart.js / recharts)
- [ ] Chưa có dark mode toggle
- [ ] FE .env đang empty — cần thêm `VITE_API_URL` cho production
- [ ] Chưa có vitest/cypress cho FE unit/e2e tests
- [ ] Image trên customer menu cần placeholder/fallback khi chưa có ảnh
- [ ] Search đang gọi API realtime — cần debounce
- [ ] Chưa có toast notification (success/error) — đang dùng alert()
