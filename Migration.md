# Domain Split: Airkrit (courses + community) / Edulyt (internships)

**Date:** 2026-07-27
**Status:** Design approved — not yet implemented
**Scope:** Frontend split into two branded builds from one repo; backend stays a single common deployment but becomes brand-aware for outbound URLs.

---

## 1. Goal

Split the product across two domains:

| Domain | Owns |
| --- | --- |
| **airkrit.com** | Courses / programs, community, cart & course checkout, instructor portal, course admin |
| **edulyt.com** | Internships, applications, entrance & certification exams, internship admin |

**airkrit.com is the incumbent live site.** It serves everything today. The split moves internships *out* to a new edulyt.com. Course, community and marketing URLs on airkrit.com do not move and need no redirects.

edulyt.com has **no marketing home page** for now — `/` renders the internships listing directly.

---

## 2. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | **One repo, two builds.** `.env.airkrit` / `.env.edulyt` alongside existing `.env.main` / `.env.whitelist`. Two deploys, one codebase, one backend. | Matches the existing per-brand env pattern. Critically, each domain needs its own `NEXTAUTH_URL`, cookie scope and OAuth callback URLs — a single deployment serving both hosts fights NextAuth. |
| D2 | **Routes gated in middleware, not physically excluded.** Both builds contain all route files; `proxy.ts` returns a real 404 for routes the brand does not own. | App Router already code-splits per route, so a visitor to airkrit.com never downloads the internships chunk. The only cost is build time. A codegen restructure would force a folder decision on every genuinely shared route (auth, profile, settings, cart, payment, verify, `/admin/users`, `/admin/orders`, `/admin/settings`, partner) and break IDE navigation and HMR. Ownership will keep moving; a map edit is one line. |
| D3 | **Independent sessions.** Same account and credentials, separate NextAuth session per domain. No cross-domain SSO. | Zero new engineering and no new auth surface to secure. Most users live on one side only. |
| D4 | **Admin split, common pages on both.** `/admin` ships on both builds; sidebar and route guard expose only that brand's sections plus the shared ones. | Admins work where the content is, without a third deployment. |
| D5 | **Partner portal on both, brand-scoped.** Each domain shows only its own data, reusing the existing `PartnerAccessProvider` gating narrowed by brand. | |
| D6 | **Dashboard splits per brand.** Airkrit: courses, community, live classes. Edulyt: internships, applications, exams. | |
| D7 | **Cart is Airkrit-only.** Internships enrol directly via `/internships/[slug]/enroll`. | |
| D8 | **Mentor pages on both; instructor portal Airkrit-only.** | Mentors span both product lines; course authoring does not. |

### The leakage risk D2 creates, and how it is contained

The danger with middleware gating is not dead code — it is a nav item, footer link, or sitemap entry pointing at a route the brand does not own. Therefore **`routeOwnership.ts` is the single source of truth for middleware, navbar, footer, admin sidebar, sitemap and robots.** These cannot be allowed to drift apart. Any component that renders a link to a top-level route must resolve ownership from that map rather than hardcoding.

---

## 3. Architecture

### 3.1 `src/config/brand.ts` (new)

Reads `NEXT_PUBLIC_BRAND` (`"airkrit" | "edulyt"`), inlined at build time. Exports one typed object — the only place a brand conditional is authored:

- `id`, `displayName`, `domain`, `siblingDomain`
- `logo`, theme tokens, favicon, OG defaults
- `navItems`, `footerSections`
- `adminSections` (composed *with*, not replacing, the existing `adminPermissions` check)
- `supportEmail`, `legalEntity`

Every consumer imports `BRAND`. No scattered `process.env.NEXT_PUBLIC_BRAND` checks outside this file.

### 3.2 `src/config/routeOwnership.ts` (new)

Maps top-level route prefixes to `"airkrit" | "edulyt" | "both"`. Exports `ownsRoute(pathname): boolean` for middleware and `isVisible(href): boolean` for link-rendering components.

### 3.3 `src/proxy.ts` (modified)

Adds an ownership check ahead of the existing auth logic. Unowned route → real 404 (not a redirect), so search engines drop it. Must run before the `withAuth` authorized callback so an unowned protected route 404s rather than bouncing to login.

---

## 4. Route ownership

### Both builds

`/login` `/register` `/forgot-password` `/profile` `/settings` `/onboarding` `/auth-redirect` `/api/auth/**` `/payment/status/[orderId]` `/paytm-redirect` `/mentor/[slug]` `/dashboard` (shell) `/dashboard/announcements` `/dashboard/certificates/**` `/partner/**` `/admin` `/admin/access` `/admin/auth` `/admin/faq` `/admin/users/**` `/admin/orders`

Legal / info pages ship on both with **per-brand content** (different legal entity, refund policy, support address): `/about` `/faq` `/privacy-policy` `/terms-of-use` `/security-policy` `/cancellation-refund-policy`

**Non-negotiable on both:** `/verify-certificate/[verificationCode]` and `/verify/intern/[internId]`. See §7.1.

### The root route `/` — owned by both, renders differently

`/` cannot be assigned to one brand in a prefix map, because both domains serve it with different content. It is owned by **both**; `app/page.tsx` branches on `BRAND.id`:

- **airkrit** → the existing `(pages)/(home)` marketing sections
- **edulyt** → the internships listing, rendered directly at `/` (render the listing component in place; do not redirect to `/internships`, which would cost a hop and split ranking signals between two URLs)

Because edulyt serves the same listing at `/` and `/internships`, the edulyt build must set a canonical tag on one of them — `/internships` — so the duplicate does not fragment indexing.

### Airkrit only

`/programs/**` · `/community/**` · `/cart` · `/dashboard/courses` · `/dashboard/live-classes` · `/live-class/**` · `/instructor/**` · `/admin/courses/**` · `/admin/community/**` · `/admin/coupons` · `/admin/testimonials`

The `(pages)/(home)` route group and all its sections are airkrit-only.

### Edulyt only

`/internships/**` · `/dashboard/internships/**` · `/dashboard/applications` · `/live-meeting/**` · `/admin/internships/**`

### `/admin/settings` — split by measured coupling

Ownership below is derived from actual course/internship reference counts in each page, not assumption:

| Page | Course refs | Internship refs | Owner |
| --- | ---: | ---: | --- |
| `partnership-import` | 303 | 0 | **Airkrit** |
| `collaboration-domains` | 56 | 0 | **Airkrit** |
| `collaboration-jobs` | 1 | 0 | **Airkrit** |
| `home-page` | — | — | **Airkrit** (edulyt has no home page) |
| `offer-letter-jobs` | 0 | 6 | **Edulyt** |
| `certificate-jobs` | 11 | 8 | **Both**, filtered by job type |
| `points` | 4 | 28 | **Both** — success points are account-level and tied to referrals |
| `colleges` | 0 | 0 | **Both** — brand-neutral master data, used at registration |
| `referral-commission-tiers` | 0 | 0 | **Both** — account-level |
| `announcements` | — | — | **Both** — audience is already `course` / `internship` / `partner` |
| `authentication-media` | — | — | **Both**, per-brand content |
| `terms-and-conditions` | — | — | **Both**, per-brand content |
| `platform-pricing` | — | — | **Both** — note: directory is currently **empty**, no files. Confirm whether this is a stub to delete or unfinished work. |

---

## 5. Frontend file impact

### New (3)

- `src/config/brand.ts`
- `src/config/routeOwnership.ts`
- `frontend/.env.airkrit`, `frontend/.env.edulyt`

### Structural — these carry the split

| File | Change |
| --- | --- |
| `src/proxy.ts` | Ownership gate → 404 for unowned routes, ahead of auth logic |
| `components/shared/Navbar/Navbar.tsx` (~L95–108) | Nav items sourced from `BRAND.navItems` |
| `components/shared/Navbar/components/NavbarContent.tsx` | Drop the internship mega-menu branch on airkrit; internship paging state and `InternshipPublicListing` fetch become edulyt-only |
| `components/shared/Navbar/components/MobileMenu.tsx` | Same, mobile |
| `components/shared/Footer/Footer.tsx` (~L54–55) | Links, tagline copy, legal entity |
| `app/admin/components/Sidebar.tsx` | `menuItems` filtered by `BRAND.adminSections`, composed with the existing `canSeeHref` / `adminPermissions` check |
| `app/admin/components/SidebarMenuItem.tsx` | Hide submenu entries for unowned routes |
| `app/(pages)/dashboard/LayoutManager.tsx` | Brand-scoped dashboard shell |
| `app/(pages)/dashboard/components/DashboardNavbar.tsx` | Brand-scoped tabs |
| `app/(pages)/dashboard/components/DashboardBanner.tsx` | Brand copy |
| `app/(pages)/(home)/**` | Airkrit only; edulyt `/` renders the internships listing |
| `app/layout.tsx` | Metadata, title template, OG, favicon per brand |
| `app/globals.css` | Brand theme tokens |
| `public/**` | Per-brand logo and icon assets |
| `next.config.ts` | Per-brand redirect sets (see §7.2) |
| `app/sitemap.ts`, `app/robots.ts` | **New** — must be generated from `routeOwnership.ts` |

### Filtering only (~20)

`hooks/useAnnouncements.ts` · `dashboard/components/dashboard/AnnouncementSection.tsx` · `HomeAnnouncements.tsx` · `admin/orders/page.tsx` · `admin/orders/OrderDetailsModal.tsx` · `admin/orders/orderDisplay.ts` · `components/admin/dashboard/SuperAdminDashboard.tsx` · `partner/components/PartnerSidebar.tsx` · `partner/state/PartnerAccessProvider.tsx` · `partner/dashboard/page.tsx` · `components/ui/partner/PartnerDashboardCharts.tsx` · `components/shared/SuccessPoints/SuccessPointsInfoModal.tsx` · `TransferPointsModal.tsx` · `lib/postLoginRedirect.ts` (role home per brand) · `configs/authOption.ts` (brand-scoped cookie name — the two production domains cannot collide anyway, but distinct names keep the two builds from clobbering each other's session on shared `localhost` during development) · `configs/apiConfig.ts` (send `X-Brand` header — see §6) · `lib/courseAudienceFilter.ts` · `admin/settings/certificate-jobs/page.tsx` · `admin/settings/points/page.tsx` · `admin/settings/announcements/page.tsx`

### Copy only (~15)

`(other-pages)/about/**` · `community/guidelines/page.tsx` · `cart/CartForm.tsx:562` · `mentor/[slug]/components/MentorPage.tsx` · `verify-certificate/[verificationCode]/page.tsx` · `verify/intern/[internId]/page.tsx` · legal pages · `(home)/components/sections/**` (airkrit only, but strip internship framing)

---

## 6. Backend — common deployment, brand-aware URLs

The backend stays one deployment, one database, one route surface. The single change is that `FRONTEND_URL` can no longer be one value.

**Add:** `AIRKRIT_URL`, `EDULYT_URL`. **Keep** `FRONTEND_URL` as fallback so behaviour is unchanged until each call site is migrated. **Add** one helper, `resolveFrontendUrl(brand)`.

| Call site | How brand is resolved |
| --- | --- |
| `controllers/auth.controller.ts` — email verification, password reset | `X-Brand` request header, set by the frontend axios interceptor in `configs/apiConfig.ts`; falls back to `FRONTEND_URL` |
| `models/certificate.schema.ts:179` | Certificate type — course → airkrit, internship / LOR → edulyt |
| `services/certificate.services.ts:142`, `:486`, `:607` | Same |
| `workers/certificate.worker.ts` | Same |
| `workers/offerLetter.worker.ts` | Always edulyt |
| `services/live-classes.services.ts` | Always airkrit |
| `services/liveMeeting.services.ts` | Always edulyt |
| `services/payments/orderFlow.ts` | Order type |
| `services/cron.services.ts` | Entity type per reminder |
| `scripts/regenerate-internship-certificates.ts`, `scripts/seed-sample-certificates.ts` | Explicit brand argument |

Email templates need per-brand logo, sender name and footer.

CORS needs no change — `app.ts:59` uses `origin: true`.

---

## 7. Migration and cutover

### 7.1 Already-issued certificates (hard constraint)

Every certificate issued to date has `airkrit.com/verify-certificate/<code>` printed into the PDF and encoded in its QR code, and interns have `airkrit.com/verify/intern/<internId>`. These are physical artefacts already in circulation.

**airkrit.com must serve `/verify-certificate/[code]` and `/verify/intern/[internId]` permanently**, for both course *and* internship certificates, resolving against the common backend. edulyt.com serves the same routes so new internship certificates can point there. Neither route may ever be gated off either build.

### 7.2 Redirects

Only internships move. On the airkrit build:

- `airkrit.com/internships` → 301 → `edulyt.com/internships`
- `airkrit.com/internships/:path*` → 301 → `edulyt.com/internships/:path*`
- `airkrit.com/dashboard/internships/:path*` → 301 → `edulyt.com/dashboard/internships/:path*`
- `airkrit.com/dashboard/applications` → 301 → `edulyt.com/dashboard/applications`

Course, community and marketing URLs are untouched. The existing `/courses` → `/programs` redirects in `next.config.ts` stay on airkrit.

**Do not** redirect the verify routes.

### 7.3 Session loss on the internship side

Because sessions are per-domain (D3), a student following a 301 from `airkrit.com/internships/...` to `edulyt.com` **arrives logged out**, including students mid-internship. This is the single most user-visible consequence of the split.

Mitigation:
- edulyt.com login page carries an explicit message: *"Edulyt is now the home of internships — sign in with your existing account."*
- Email campaign to active interns ahead of cutover.
- Redirects preserve the path so post-login `callbackUrl` returns them to where they were heading. Verify `lib/postLoginRedirect.ts` honours this for internship paths.

### 7.4 Third-party configuration (blocking, external)

- **Google OAuth** — add `edulyt.com` authorised origin + redirect URI; verify consent-screen domain ownership.
- **LinkedIn OAuth** — same.
- **Paytm** — internship order return/callback URL must be whitelisted for edulyt.com. Coordinate with the Razorpay Phase 2 work; the frontend is still Paytm-only across its launchers, so the internship checkout on edulyt.com must be confirmed working before cutover.
- **DNS / TLS** for edulyt.com.
- **Search Console** — register edulyt.com. Change-of-address is *not* applicable (partial move); rely on the 301s.

---

## 8. Rollout phases

Each phase is independently shippable and reversible.

**Phase 0 — brand plumbing, no behaviour change.**
Add `brand.ts`, `routeOwnership.ts`, sitemap/robots. Drive navbar, footer and admin sidebar from them. `NEXT_PUBLIC_BRAND` unset behaves exactly as today (everything owned). Ship to production; nothing visibly changes. This de-risks the largest refactor.

**Phase 1 — backend brand-aware URLs.**
Additive only. `AIRKRIT_URL` / `EDULYT_URL` added, both initially pointing at airkrit.com so behaviour is identical. Migrate all 11 call sites behind `resolveFrontendUrl`. Verify certificate generation, auth emails, live-class links and payment returns still resolve correctly.

**Phase 2 — stand up edulyt.com.**
Deploy the edulyt build with `NEXT_PUBLIC_BRAND=edulyt`. OAuth and payment config in place. **airkrit.com still serves internships** — no redirects yet. Both work in parallel. Soak, test the full internship journey end to end on the new domain.

**Phase 3 — cutover.**
Point `EDULYT_URL` at edulyt.com. Flip airkrit to `NEXT_PUBLIC_BRAND=airkrit`, enabling the internship 404 gate and the 301s. Send the intern email campaign. Monitor 404s and login failures.

**Phase 4 — cleanup.**
Remove internship framing from airkrit marketing copy, home sections and footer. Per-brand legal pages.

---

## 9. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Existing certificate QR codes break | **High** | §7.1 — verify routes permanently on both, never gated |
| Mid-internship students logged out at cutover | **High** | §7.3 — messaging, email campaign, `callbackUrl` preservation |
| Payment callback not whitelisted for edulyt.com → silent checkout failure | **High** | §7.4 — verify in Phase 2 before any traffic moves |
| Nav/footer/sitemap drift from the ownership map, producing links to 404s | Medium | D2 — single source of truth; add a test asserting every rendered nav/footer href is owned by the brand |
| Auth emails link to the wrong brand | Medium | §6 — `X-Brand` header; test both flows in Phase 1 |
| Partner with data on both sides sees a partial view | Medium | Confirm behaviour with a real dual-side partner account before Phase 3 |
| `admin/orders` and `certificate-jobs` filters hide records an admin needs | Low | Filter by brand with an explicit "show all" affordance for super-admins |

---

## 10. Open items

1. **`admin/settings/platform-pricing` is an empty directory** — confirm whether it is a stub to delete or unfinished work before assigning ownership.
2. Confirm `/live-class` is course-only and `/live-meeting` internship-only. The recent course-live-classes rebuild reused the internship live-meeting model, so verify the two route trees are genuinely separate before gating them to different brands.
3. Decide whether a dual-side student gets a cross-link ("you also have internships on Edulyt"). Deferred — deliberately not in scope for the initial split.
4. Confirm whether `colleges` master data is written from both admins or only one, to avoid concurrent-edit confusion.

---

## 11. Out of scope

- Cross-domain SSO (D3 — revisit only if dual-side usage proves material)
- Physically excising unowned routes from each bundle (D2)
- A separate admin subdomain
- Splitting the backend, the database, or the repo
- Community on edulyt.com
- Marketing home page for edulyt.com
