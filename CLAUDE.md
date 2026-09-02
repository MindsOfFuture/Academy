# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Academy — educational platform (robotics/programming for public schools in Minas Gerais, Brazil), built by Minds of the Future with UFJF and the state government. Next.js 15 App Router + Supabase. **Code comments, UI strings, and error messages are in Portuguese** — match that when editing existing files.

## Commands

```bash
npm install                              # node_modules is not checked in
npm run dev                              # Next dev server w/ Turbopack, :3000
npm run build
npm run lint                             # ESLint (next/core-web-vitals + next/typescript)

npm test                                 # Vitest, watch mode
npm test -- --run                        # single pass (what CI runs)
npm test -- --run --coverage             # v8 coverage; thresholds 60/50/60/60 enforced
npm test -- --run tests/unit/lib/api/courses.test.ts     # one file
npm test -- --run -t "should return mapped courses"      # one test by name

npm run test:e2e                         # Playwright, all projects (auto-starts dev server)
npm run test:e2e:mobile                  # mobile-chrome + mobile-safari + mobile-safari-mini
npm run test:e2e:ui                      # UI/debug mode
npx playwright test --project=chromium   # single project
npx playwright test e2e/flows/           # single directory
```

There is no `typecheck` script; `tsc --noEmit` works but note `tsconfig.json` **excludes** `tests/` and all `*.test.*`/`*.spec.*` files, so test files are not type-checked by it (Vitest transpiles them).

CI (`.github/workflows/`): `tests.yml` runs lint + `npm test -- --run --coverage` on push to `main`/`develop` and PRs to `main`. `playwright.yml` runs the full E2E suite.

## Environment

`.env.example` only covers Supabase. Vars actually read by the code:

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required; if either is missing/blank the middleware fails **closed** — 503 on every non-exempt route (`missingSupabaseEnv()` in `lib/utils.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, never `NEXT_PUBLIC_*` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | email dispatch |
| `RESEND_TEST_RECIPIENT` | if set, **all** outbound email is redirected to it (`lib/email/resend.ts`) |
| `NEXT_PUBLIC_APP_URL`, `VERCEL_URL` | absolute-URL construction |
| `TEST_{STUDENT,TEACHER,ADMIN}_{EMAIL,PASSWORD}` | Playwright auth fixtures; those specs skip without them |

## MCP servers (`.mcp.json`)

`.mcp.json` is committed so the team points at the same services. `supabase` is HTTP
and needs nothing local. The six `hostinger-*` servers (hosting, domains, dns, reach,
vps, ecommerce — 244 tools total) are stdio and spawn via `npx.cmd`, so they are
Windows-shaped; on Linux/macOS change `command` to `npx`.

They read `HOSTINGER_API_TOKEN` from the **OS environment**, referenced in `.mcp.json`
as `${HOSTINGER_API_TOKEN}` — the literal token must never be written into this file,
which is git-tracked and would leak VPS/DNS/domain/billing access for the whole
account. Two traps, both of which surface as `{"message":"Unauthenticated."}` while
`claude mcp list` still reports every server as connected:

- the `env` block of `.claude/settings.local.json` is **not** injected into an MCP
  stdio subprocess — setting the token there does nothing;
- on Windows, `setx HOSTINGER_API_TOKEN <token>` only affects **new** processes, so
  the terminal or editor must be restarted before the servers can authenticate.

Get a token at hPanel → API. The package also accepts `API_TOKEN`/`APITOKEN`.

## Architecture

### Three Supabase clients — pick deliberately

`lib/supabase/` exposes four factories, and choosing wrong is the most common source of auth bugs:

- `client.ts` → `createClient()` — browser, anon key, RLS applies.
- `server.ts` → `createClient()` — SSR/route handlers, anon key + cookie session, RLS applies.
- `server.ts` → `createAdminClient()` — **verifies the caller has the `admin` role via `user_role`/`role` before** returning a service-role client. Throws on failure. Use this for admin mutations.
- `server.ts` → `createServiceRoleClient()` — raw service-role client, **no permission check at all**. Only for flows that legitimately have no authenticated caller (e.g. notification fan-out). Guard it yourself.

### Data access layer: `lib/api/`

All Supabase queries live here; UI components import from `lib/api/*`, never talk to Supabase directly. Each module maps snake_case DB rows (`*Row` types) to camelCase view models (`*Summary`, `*Detail`) declared in `lib/api/types.ts`.

**The `-server` filename suffix is unreliable.** Some modules with no suffix are server-only. Check the first line of the file before importing:

- `import "server-only"` → `articles.ts`, `content.ts`, `credits.ts`, `learning-paths.ts`, `profiles-server.ts`
- `"use server"` (Server Actions) → `courses-server.ts`, `enrollments-server.ts`
- server client, no directive → `notifications-server.ts`
- browser client → `activity-chat.ts`, `assignments.ts`, `certificates.ts`, `courses.ts`, `enrollments.ts`, `oauth.ts`, `profiles.ts`

`mapCourse`/`mapLesson`/`mapModule` live once in `lib/api/types.ts` and are imported by `courses.ts`, `courses-server.ts`, `enrollments.ts`, `enrollments-server.ts`, and `learning-paths.ts`. `getCurrentUserAndRole(supabase)` (browser-side role resolution) lives once in `profiles.ts`; the server-side equivalent is `fetchRoleForUser` in `profiles-server.ts`.

### Auth & route protection

`middleware.ts` → `lib/supabase/middleware.ts#updateSession`. It calls `supabase.auth.getUser()` and redirects unauthenticated users to `/auth?next=<path>` unless the path matches `PUBLIC_PATH_PREFIXES` (an explicit allowlist: `/auth`, `/oauth/consent`, `/termos`, `/privacidade`, `/artigos`, `/api/articles`, three `/api/auth/*` routes, `/api/notifications`) or is exactly `/`. **New public pages or public API routes must be added to that array**, and public API routes are then responsible for their own auth checks. Never insert code between `createServerClient` and `auth.getUser()` in this file.

### Roles & the teacher-verification gate

Roles are relational, not a column: `user_role` (`user_profile_id`, `role_id`) → `role` (`id`, `name`). `RoleName = "admin" | "teacher" | "student" | "unknown"`. Resolution precedence is admin > teacher > student; absent rows default to `"student"`. `fetchRoleForUser` in `lib/api/profiles-server.ts` is the canonical resolver (also re-exported for other server modules); `courses.ts` has its own client-side variant.

Teachers carry a separate `verification_status` (`pending` | `approved` | `rejected`, tracked in `user_profile` + `teacher_request`). Publishing content requires **both** the teacher role and `approved`. Enforce it by calling `ensureCurrentTeacherVerifiedForPublishing()` from `profiles-server.ts` — see `app/api/learning-paths/route.ts` for the pattern, including mapping the thrown message to a 403.

Teacher-owned content is additionally scoped by `owner_id`; `ensureCourseOwnerOrAdmin` in `lib/api/courses.ts` enforces this for the `teacher` role only (admins bypass).

### Route handlers

`app/api/**/route.ts` follow one shape: try/catch, `await ensure…()` permission helpers, delegate to `lib/api`, and return `NextResponse.json`. Errors are surfaced as `{ error: message }` with the status inferred from the message text (403 for verification/role failures, else 500).

### Subsystems

Each is a `lib/api` module plus components:
- **Courses** — `course` → `course_module` → `lesson`, with `enrollment` + `lesson_progress` for student state. `audience` is `'student' | 'teacher'` and filters what each role sees.
- **Learning paths** (`trilhas`) — `learning_path` + ordered `learning_path_course` join; reorder endpoint under `app/api/learning-paths/[pathId]/courses/reorder`.
- **Assignments & grading** — `assignment`, `assignment_submission`; teacher grading queue in `components/dashboard/PendingCorrections.tsx` and `GradingModal.tsx`.
- **Certificates** — `lib/api/certificates.ts` checks completion, issues a verification code, `app/validar` validates it; PDF via `lib/utils/pdfGenerator.ts` (jsPDF).
- **Notifications + email** — `lib/api/notifications-server.ts` writes `notification` rows and calls `sendNotificationEmail`. Email failures are logged and swallowed so they never break the notification write.
- **Activity chat** — `activity_chat_message`, uses Supabase realtime (`subscribeToMessages`).
- **Telemetry** — `lib/services/tracking.service.ts` is a client-side singleton that batches events (flush at 10 events or 2s, plus on `visibilitychange`/`beforeunload`) into `telemetry_video_interaction` and `telemetry_content_review` (the `telemetry_assessment_interaction` writer was removed as unused; the table remains). Append-only. Payload types in `lib/api/telemetry-types.ts`, examples in `docs/telemetry-examples.json`. Call `trackingService.init()` once.

## Conventions & gotchas

- `@/*` resolves to the **repo root** (`tsconfig.json` and the Vitest alias). So `@/lib/...`, `@/components/...`, `@/tests/mocks/supabase`.
- Supabase joins can return a single object *or* an array depending on the relationship shape. Always go through `getMediaUrl()` in `lib/api/types.ts` (typed as `MediaRef`) instead of reading `.url` directly.
- Foreign-key hints are sometimes required in selects: `thumb:media_file!course_thumb_id_fkey(url)`.
- UI is a mix of local `components/ui/*` (shadcn-style, CVA variants, `cn()` from `lib/utils.ts`), Radix primitives, and HeroUI. Tailwind theme is CSS-variable driven (`hsl(var(--primary))`), `darkMode: ["class"]`. Brand palette is purple/yellow.
- ESLint keeps `no-explicit-any`, `no-unused-vars`, `no-img-element`, and `exhaustive-deps` at **warn** — they don't fail CI, so lint output is noisy; don't assume a clean run.
- `next.config.ts` allows remote images from **any** https host.

## Testing

Unit tests live in `tests/` (mirroring source paths), not next to source; Vitest `include` is `tests/**/*.{test,spec}.{ts,tsx}`. jsdom + `@testing-library/react`, `@testing-library/jest-dom` loaded via `vitest.setup.ts`.

Supabase is mocked through the factory in `tests/mocks/supabase.ts`. The pattern (see `tests/unit/lib/api/courses.test.ts`):

```ts
let mockClient: MockSupabaseClient;
vi.mock('@/lib/supabase/client', () => ({ createClient: () => mockClient }));
import { listCourses } from '@/lib/api/courses';   // import AFTER vi.mock
```

The mock returns a thenable chain draining a FIFO queue — queue responses with `mockQueryResponse(client, data)`, or override the specific terminal method the code under test awaits (`mockClient.chain.order.mockResolvedValueOnce(...)`). Helpers: `mockAuthenticatedUser`, `mockUnauthenticatedUser`, `resetMockClient`.

E2E is organized by target, and `playwright.config.ts` maps directories to projects — put a spec in the right folder or it won't run:

| Dir | Runs under |
|---|---|
| `e2e/desktop/` | chromium, firefox, webkit |
| `e2e/mobile/` | mobile-chrome, mobile-safari, mobile-safari-mini |
| `e2e/flows/` | chromium |
| `e2e/visual/` | chromium (specs set their own viewports) |

All projects depend on the `setup` project (`e2e/global.setup.ts`). Shared helpers in `e2e/fixtures/` (`auth.fixture.ts`, `mobile.fixture.ts`). `e2e/README.md` inventories the suite.

## Database migrations

`supabase/migrations/` holds only three recent SQL files (credits entries, deleted-user data scrubbing) — it is **not** a complete schema history. The live schema is defined in the hosted Supabase project; infer table shapes from the `*Row` interfaces in `lib/api/types.ts` and the select strings in `lib/api/`.
