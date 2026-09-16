# Backend: current implementation

Status: internal pilot, not public-launch ready. Updated: 2026-09-15.

## Audit

The original `axioma_pr.tsx` is a roughly 10,000-line React prototype. Its mock
arrays and local component state are not a database, authentication boundary or
payment system. Existing GitHub Pages deployment only serves static files.
It cannot run this API. Existing uncommitted report changes have been preserved.

The first backend is a modular monolith: Node 24, Fastify 5, PostgreSQL 17,
versioned SQL migrations, parameterized queries, Zod validation. No Redis or
microservices are necessary for this pilot.

## Implemented

- Customer registration; password hashing using salted scrypt; expiring opaque
  HttpOnly sessions stored as hashes; logout revokes the session.
- Role enforcement and ownership checks. Admin/publisher provisioning is a CLI
  operation, never a public registration parameter.
- Customer projects and advertisers. Advertisers stay pending until a real
  verification integration exists; there is deliberately no fake success API.
- Persistent material batches, individual updates with optimistic version
  checks, moderation, rejection reasons and a priority queue.
- Outlet creation/editing share a validation schema. Editing returns the outlet
  to moderation. Activity toggling is permitted only after approval.
- Formats: article, news, post, longread. Outlet types: media, Telegram, VK,
  MAX, Dzen. Goals, aggregators, geography, daily audience, Medialogia, requirements,
  Metrika URL, format prices, seasonal coefficient and dated discount are stored.
- Orders snapshot approved material, advertiser and outlet identity, format,
  price and commission. Later material edits do not mutate placed orders.
- Order transitions: pending -> accepted -> submitted -> completed; publisher
  rejection refunds the reserve. A customer dispute holds the reserve until an
  administrator refunds or releases it.
- Publication requires HTTP(S) URL and marking confirmation.
- Separate internal available/reserved accounts, balanced transfers, ledger and
  audit trail. All money is integer kopecks. No external payment is implemented.
- Financial/batch endpoints require an Idempotency-Key. The stored response and
  request fingerprint are committed with the business transaction. Conflicting
  payloads using the same key return 409.
- Atomic batch rollback: an invalid outlet/material or insufficient funds leaves
  no partial order/charge. PostgreSQL row locks protect account changes.
- Accelerated moderation costs 5,000 kopecks per material. Commission defaults
  to 1,500 basis points (15%, inherited from the prototype), configurable and
  snapshotted. This commercial assumption requires confirmation before launch.
- Persistent order chat and support conversations with participant/admin access.
  Closed tickets reject replies. Admin user, advertiser, account and audit lists
  read the database. Material, project, outlet and financial changes are audited.
- Short sequential public order and dispute numbers; UUIDs remain internal keys.
- Informer creation, publication, pause and date windows (Moscow timezone).
  Outlet selections refer to approved active database outlets, not mock IDs.

## UI boundary

- `/` serves the public landing, including for authenticated users. There is
  no separate simplified cabinet. Authentication determines the actual role.
- Connected flows include projects, advertisers, material batches and individual
  editing, catalogue prices, order creation, publisher acceptance/publication,
  customer acceptance and administrator material moderation.
- Connected API flows show failures rather than simulated success. Several
  legacy screens still use mock fallbacks; see `INTERNAL-FUNCTIONAL-AUDIT.md`.
- Full integration is unfinished: reporting, notifications, account settings
  and some secondary dashboard metrics
  still need connection or replacement of demo content. API availability is
  not proof that every corresponding UI action is connected.
- Materials persist plain text, metadata and attachment IDs. Rich-text toolbar
  actions remain unfinished; they must not be presented as production-ready.
- Attachments are stored in `STORAGE_ROOT` (default `.local-files`), with database
  metadata, content-type validation, 20 MB per file and 500 MB per account.
  Owner/admin access and publisher access through order snapshots are enforced.
  Docker uses a persistent attachment volume. Malware scanning, orphan cleanup
  and a production object-storage adapter remain launch blockers.
- Current list endpoints cap responses at 200 rows; cursor pagination must be
  introduced before external pilot workloads.

## Local run without Docker

For local publisher/admin accounts, stop the local API first, then run
`node server/local.mjs --create-accounts` and restart it. This explicit command
creates `publisher@axioma.local` and `admin@axioma.local` with random passwords
in `.local-accounts.json` (0600, ignored by Git). Existing accounts are never
reset. Select the corresponding role in the original login modal. This command
is unavailable in production; deployed accounts use the provisioning CLI.

```sh
pnpm install --frozen-lockfile
pnpm run api:local
# In a second terminal:
pnpm run dev
```

Open http://127.0.0.1:5173/. Local mode uses a persistent embedded
Postgres-compatible PGlite database in ignored `.local-db/`. It is loopback-only
and refuses NODE_ENV=production. No users or balances are seeded automatically.
Registration is available; a pending advertiser can be used to save drafts but
  cannot send material to moderation. Only explicit local demo seeds and automated
  test fixtures bypass verification and issue fictitious balances.

## PostgreSQL run

Configure `.env` from `.env.example` with a non-default password. DATABASE_URL
must use that password (URL-encode special characters).

```sh
docker compose up -d db
pnpm run db:migrate
pnpm run api:dev
pnpm run dev
```

Or build the API container and run migrations as an explicit release step:

```sh
docker compose --profile api build
docker compose --profile api run --rm api node server/cli.mjs migrate
docker compose --profile api up -d
```

Production requires APP_ORIGIN=https://your-domain, NODE_ENV=production, a TLS
reverse proxy forwarding `/api` to the API, and SPA fallback for the original UI.
The container serves the API only. It does not host `dist/` or terminate TLS.
Never expose PostgreSQL to the internet. Do not use local compose credentials
in production. Do not route public traffic to the mock prototype as a real app.

Provision staff via `pnpm run db:user` with CREATE_USER_EMAIL,
CREATE_USER_PASSWORD and CREATE_USER_ROLE (`admin` or `publisher`) supplied
through a secure environment. No built-in credentials. Do not place passwords
in scripts, git, command arguments or documentation. Invite delivery is pending.

## API contract

All routes start with `/api`. Write requests require an Origin header exactly
matching APP_ORIGIN. Browser calls use same-origin cookies and the Vite proxy;
CORS is not enabled. This is not a public token API.

| Route | Methods / access |
| --- | --- |
| `/health` | GET, database liveness |
| `/auth/register`, `/auth/login`, `/auth/logout` | POST |
| `/auth/me` | GET |
| `/projects`, `/advertisers` | GET/POST, customer |
| `/materials` | GET, customer own/admin all |
| `/materials/batch` | POST, customer, idempotent |
| `/materials/:id` | PUT, customer owner; version required |
| `/materials/submit` | POST, customer, ids + expedited, idempotent |
| `/moderation` | GET, admin, expedited first then FIFO |
| `/moderation/:id` | POST, admin, approved + reason |
| `/outlets` | GET with goal/kind/geography; POST publisher |
| `/outlets/:id` | PUT, publisher owner |
| `/outlets/:id/active` | POST, publisher owner or admin |
| `/admin/outlets/:id` | POST, admin, approved |
| `/orders` | GET scoped; POST customer, materialId/outletIds, idempotent |
| `/orders/:id/action` | POST, scoped transition, idempotent |
| `/orders/:id/project` | POST, customer owner, projectId or null |
| `/balance`, `/transactions` | GET, current user only |
| `/admin/users`, `/admin/advertisers`, `/admin/audit`, `/admin/ledger` | GET, admin |
| `/orders/:id/messages` | GET/POST, order participants or admin |
| `/tickets` | GET own/admin all; POST customer/publisher |
| `/tickets/:id/messages` | GET/POST owner or admin |
| `/tickets/:id` | PATCH open/closed, admin |
| `/informers` | GET active scheduled items/admin all; POST admin |
| `/informers/:id` | PUT/DELETE admin |

Error statuses: 400 validation, 401 unauthenticated, 403 forbidden/Origin,
404 unavailable ownership, 409 state/version/funds/idempotency conflict, 429
rate limit. Unexpected failures return no stack trace or database details.
Rate limits are in-process for one instance. Distributed limiting is a launch
requirement if the API is horizontally scaled.

## Verification

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm run build
```

Local API tests use embedded Postgres. CI uses PostgreSQL 17 via
TEST_DATABASE_URL and runs the same tests, migrations, typecheck and build.
Use a dedicated disposable database for TEST_DATABASE_URL; fixtures add data.
Docker and a PostgreSQL server were unavailable on the development machine, so
the native PostgreSQL/Compose workflow has not yet been executed locally.

Browser smoke: `node server/test/prototype-browser.mjs` with Playwright installed,
both local servers running. PLAYWRIGHT_MODULE and PLAYWRIGHT_CHANNEL may select
an externally installed runtime. It creates QA-only accounts and drafts.

## Launch blockers

1. Connect the designed customer/publisher/admin screens to typed API models.
   Remove role-switch access and mocks from the public application build.
2. Email verification, password reset, staff invitations, account blocking,
   stronger administrator authentication and session-management UI.
3. Publisher applications/ownership verification and advertiser registry
   integration. Do not enable arbitrary manual verification shortcuts.
4. Harden the implemented private file storage: malware scanning, production
   object storage, backup/restore and an attachment retention/deletion policy.
5. Agreed payment and payout model, provider sandbox, verified webhooks,
   idempotent deposits, refunds, reconciliation and document issuance. The
   internal ledger is not an escrow service or a connected bank account.
6. Deadline jobs, notifications/outbox, chat attachments and delivery receipts,
   reports/exports and publisher payouts.
7. Migration/recovery rehearsal on real PostgreSQL, concurrent-load tests,
   backup/restore drill, metrics/alerts, secret rotation and security review.
8. Confirm privacy/contract/marking/accounting requirements with responsible
   specialists; technical implementation alone is not legal readiness.

## Proposed providers (not connected)

- Yandex Cloud Compute + Managed PostgreSQL + private Object Storage + Postbox:
  https://yandex.cloud/en/services and https://yandex.cloud/en/docs/postbox/.
- YooKassa for payment acceptance, subject to approval of the exact B2B money
  flow. Do not assume its C2C Safe Deal product fits company/IP publishers:
  https://yookassa.ru/developers/solutions-for-platforms/safe-deal/basics.
- No services were purchased, accounts provisioned or production deployed.
