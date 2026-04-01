# 🗂️ BACKEND MEMORY — QR-Home Generation System

> **File này dùng để review lại toàn bộ những gì đã làm ở phía Backend.**
> **Cập nhật lần cuối:** 2026-04-01

---

## 📋 Tổng quan

- **Framework:** NestJS v11 + TypeScript (strict mode)
- **ORM:** TypeORM v0.3
- **Database:** PostgreSQL 16
- **Auth:** JWT (passport-jwt), bcrypt
- **QR Generation:** qrcode (npm)
- **File Upload:** Multer (disk storage)
- **Test:** Jest (unit tests)
- **Port:** 3000
- **API Prefix:** `/api`

---

## 📁 Cấu trúc thư mục

```
BE/
├── .env                          # Secrets (gitignored)
├── .env.example                  # Template (committed)
├── .gitignore
├── .dockerignore
├── .prettierrc
├── Dockerfile                    # Multi-stage: build + production (node:20-alpine)
├── ormconfig.ts                  # TypeORM CLI config (migrations)
├── nest-cli.json
├── eslint.config.mjs
├── tsconfig.json / tsconfig.build.json
├── package.json
│
├── src/
│   ├── main.ts                   # Entry point: CORS, ValidationPipe, ExceptionFilter, TransformInterceptor
│   ├── app.module.ts             # Root module: TypeORM, ConfigModule, ServeStatic, all feature modules
│   │
│   ├── common/
│   │   ├── dto/
│   │   │   └── pagination.dto.ts               # Page + limit (class-validator)
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts        # Global error → { success, statusCode, message, path }
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts        # Auto wrap response → { success: true, data }
│   │   └── interfaces/
│   │       └── api-response.interface.ts       # ApiResponse<T> type
│   │
│   ├── database/
│   │   ├── migrations/                         # (Chưa generate — đang dùng synchronize: true ở dev)
│   │   └── seeds/
│   │       └── admin.seed.ts                   # Seed admin (admin/admin123) + 4 categories mặc định
│   │
│   └── modules/
│       ├── auth/          → Chi tiết ở mục [Modules] bên dưới
│       ├── categories/
│       ├── services/
│       ├── qr-config/
│       ├── traffic/
│       └── upload/
│
└── test/
    ├── jest-e2e.json
    └── app.e2e-spec.ts            # (Scaffold từ NestJS, chưa edit)
```

---

## 🧩 Modules chi tiết

### 1. Auth Module (`modules/auth/`)

| File | Chức năng |
|------|-----------|
| `entities/admin.entity.ts` | Entity `admins`: id (UUID), username (unique), password_hash, last_login, created_at |
| `dto/login.dto.ts` | Validate: username (required), password (min 6 chars) |
| `strategies/jwt.strategy.ts` | Passport JWT strategy, extract from Bearer token |
| `guards/jwt-auth.guard.ts` | Guard wrapper cho JWT strategy |
| `auth.service.ts` | `login()`: verify bcrypt → tạo JWT, update lastLogin. `getProfile()`: trả id + username |
| `auth.controller.ts` | `POST /api/auth/login` (public), `GET /api/auth/me` (protected) |
| `auth.module.ts` | Wire JWT module (async config từ ConfigService), export PassportModule |
| `auth.service.spec.ts` | **5 tests**: login success, invalid username, invalid password, getProfile success, getProfile not found |

**JWT Payload:** `{ sub: adminId, username }`
**Token expiry:** Cấu hình qua `JWT_EXPIRES_IN` trong .env (default: 24h)

---

### 2. Categories Module (`modules/categories/`)

| File | Chức năng |
|------|-----------|
| `entities/category.entity.ts` | Entity `categories`: id, name, slug (unique), sort_order, is_active, created_at. **OneToMany → Service** |
| `dto/create-category.dto.ts` | name (required), slug (required), sortOrder?, isActive? |
| `dto/update-category.dto.ts` | PartialType(CreateCategoryDto) |
| `categories.service.ts` | `findAll()` (sorted), `findActive()`, `findOne()`, `create()` (slug uniqueness check), `update()`, `remove()` |
| `categories.controller.ts` | `GET /` (public), `GET /active` (public), `GET /:id`, `POST /` (auth), `PATCH /:id` (auth), `DELETE /:id` (auth) |
| `categories.service.spec.ts` | **4 tests**: findAll, create success, create duplicate slug → ConflictException, findOne not found, remove |

**Business Rules:**
- Slug phải unique → throw `ConflictException` nếu trùng
- Delete cascade: khi xóa category → xóa luôn services thuộc category đó (FK constraint)

---

### 3. Services Module (`modules/services/`)

| File | Chức năng |
|------|-----------|
| `entities/service.entity.ts` | Entity `services`: id, category_id (FK), name, description_short (500), description_full (text), price (decimal), currency, image_url, is_best_seller, is_new_service, is_combo, is_active, sort_order, created_at. **ManyToOne → Category, OneToMany → TrafficLog** |
| `dto/create-service.dto.ts` | Full validation: categoryId (UUID), name, descriptions, price (min 0), imageUrl, labels, sortOrder |
| `dto/update-service.dto.ts` | PartialType(CreateServiceDto) |
| `dto/query-service.dto.ts` | Extends PaginationDto + search?, categoryId?, isActive?, label? (`best_seller`/`new_service`/`combo`) |
| `services.service.ts` | `findAll(query)`: QueryBuilder với search (LIKE), filter by category/status/label, pagination. `findAllActive()`: chỉ lấy is_active=true (cho customer). `findOne()`, `create()`, `update()`, `remove()`, `countActive()`, `countAll()` |
| `services.controller.ts` | `GET /` (auth — admin xem tất cả), `GET /public` (public — customer chỉ thấy active), `GET /:id`, `POST/PATCH/DELETE` (auth) |

**Pagination response:** `{ items[], total, page, limit, totalPages }`

---

### 4. QR Config Module (`modules/qr-config/`)

| File | Chức năng |
|------|-----------|
| `entities/qr-config.entity.ts` | Entity `qr_config`: id, status (enum: active/paused/inactive), qr_url, generated_at, updated_at. **Singleton row** |
| `dto/update-qr-status.dto.ts` | status: QrStatus (enum validation) |
| `qr-config.service.ts` | `getConfig()`: lấy hoặc tạo config singleton. `generateQr()`: check có active services → tạo QR URL → set active. `updateStatus()`: business rules. `getQrImage()`: tạo QR data URL (512px, navy color) |
| `qr-config.controller.ts` | `GET /` (public), `GET /status` (public — dùng cho customer middleware), `POST /generate` (auth), `PATCH /status` (auth), `GET /download` (auth) |
| `qr-config.service.spec.ts` | **3 tests**: generate without services → error, generate with services → success, activate without services → error |

**Business Rules:**
- ❌ **Cannot generate**: nếu countActive() === 0
- ❌ **Cannot activate**: nếu countActive() === 0
- ❌ **Cannot download**: nếu status === inactive hoặc paused
- QR URL format: `{FRONTEND_URL}/menu`

---

### 5. Traffic Module (`modules/traffic/`)

| File | Chức năng |
|------|-----------|
| `entities/traffic-log.entity.ts` | Entity `traffic_logs`: id, service_id (FK nullable), ip_address, user_agent, visited_at. **service_id = NULL → page view, service_id != NULL → service view** |
| `dto/log-visit.dto.ts` | serviceId?, ipAddress?, userAgent? |
| `traffic.service.ts` | `logVisit()`: tạo log. `getWeeklyTraffic()`: 7 ngày, GROUP BY date (page views). `getMostViewedService()`: top 1 service JOIN. `getTopViewedServices()`: top 5 trong 30 ngày. `getGrowth()`: today vs yesterday %. `getTotalServiceViews()`: count non-null service_id |
| `traffic.controller.ts` | `POST /log` (public — customer site gọi), `GET /weekly` (auth), `GET /most-viewed` (auth), `GET /top-viewed` (public — article slide), `GET /growth` (auth), `GET /dashboard` (auth — aggregate) |

**Dashboard endpoint** (`GET /api/traffic/dashboard`) trả về:
```json
{ "weekly": [...], "mostViewed": {...}, "growth": {...}, "totalViews": number }
```

---

### 6. Upload Module (`modules/upload/`)

| File | Chức năng |
|------|-----------|
| `upload.controller.ts` | `POST /api/upload` (auth): Multer disk storage, UUID filename, chỉ chấp nhận jpg/png/gif/webp, max 5MB |

**Response:** `{ url: "/uploads/uuid.ext", originalName, size }`
**Static serving:** Files trong `./uploads` được serve tại `/uploads/*` via ServeStaticModule

---

## 🔧 Cấu hình quan trọng

### main.ts
- Global prefix: `/api`
- CORS: cho phép `localhost:5173`, `localhost:4173`, `FRONTEND_URL`
- ValidationPipe: whitelist + forbidNonWhitelisted + transform
- HttpExceptionFilter: global error handling
- TransformInterceptor: auto wrap `{ success: true, data }`

### ormconfig.ts
- Dùng cho TypeORM CLI (`npm run migration:generate/run/revert`)
- Entities glob: `src/modules/**/entities/*.entity{.ts,.js}`

### app.module.ts
- `synchronize: true` trong development (auto sync schema)
- `synchronize: false` trong production (cần migration)

---

## 🧪 Unit Tests

```
✅ auth.service.spec.ts        — 5 tests
✅ categories.service.spec.ts  — 4 tests  
✅ qr-config.service.spec.ts   — 4 tests
────────────────────────────────────────
   Total: 13 tests PASSED
```

---

## 📦 NPM Scripts

| Script | Chức năng |
|--------|-----------|
| `npm run start:dev` | Chạy dev (watch mode) |
| `npm run build` | Build production |
| `npm run start:prod` | Chạy production build |
| `npm run test` | Chạy unit tests |
| `npm run test:cov` | Tests + coverage |
| `npm run seed` | Seed admin + categories |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |
| `npm run migration:revert` | Revert migration |
| `npm run format` | Prettier format |
| `npm run lint` | ESLint fix |

---

## 🐳 Docker

- **Dockerfile**: Multi-stage (node:20-alpine)
  - Stage 1: `npm ci` + `npm run build`
  - Stage 2: Copy dist + prod node_modules → `node dist/main.js`
- **Exposed port:** 3000

---

## 🔐 Environment Variables (.env)

| Variable | Example | Mô tả |
|----------|---------|-------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USERNAME` | postgres | DB username |
| `DB_PASSWORD` | qr_home_secret_2026 | DB password |
| `DB_DATABASE` | qr_home | DB name |
| `JWT_SECRET` | qr-home-jwt-dev-... | JWT signing secret |
| `JWT_EXPIRES_IN` | 24h | Token expiry |
| `PORT` | 3000 | API port |
| `NODE_ENV` | development | Environment |
| `UPLOAD_DIR` | ./uploads | Upload directory |
| `MAX_FILE_SIZE` | 5242880 | Max upload (5MB) |
| `FRONTEND_URL` | http://localhost:5173 | FE URL (for QR) |

---

## ⚠️ Lưu ý & Todo

- [ ] Migration files chưa generate (đang dùng `synchronize: true` ở dev)
- [ ] Chưa có services.service.spec.ts
- [ ] Chưa có traffic.service.spec.ts
- [ ] E2E test file mặc định chưa cập nhật
- [ ] Chưa có rate limiting
- [ ] Chưa có logging middleware
- [ ] Seed data chưa có sample services
