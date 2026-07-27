# Airkrit / Edulyt Domain Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the platform across two domains — airkrit.com (courses, community) and edulyt.com (internships) — as two branded builds of one frontend repo against one common backend.

**Architecture:** A single `brand.ts` config, selected by `NEXT_PUBLIC_BRAND` at build time, drives navigation, footer, admin sidebar, metadata and theming. A separate `routeOwnership.ts` map assigns every top-level route prefix to `airkrit`, `edulyt` or `both`, and is the single source of truth for the middleware 404 gate, link rendering, sitemap and robots. The backend stays one deployment but resolves outbound URLs per brand.

**Tech Stack:** Next.js 16 (App Router), React 19, NextAuth v4, TypeScript, Tailwind v4, Express + Mongoose backend, Vitest.

**Spec:** [Migration.md](Migration.md) — read it before starting. This plan implements that spec.

## Global Constraints

- `NEXT_PUBLIC_BRAND` accepts exactly `"airkrit"` or `"edulyt"`. **Unset must mean "behave exactly as today"** — every task in Phase 0 is a provable no-op until the env var is set. This is what makes Phase 0 safe to ship to production.
- `/verify-certificate/[verificationCode]` and `/verify/intern/[internId]` are owned by `both` and **must never be gated off either build**. Certificates already in circulation have `airkrit.com` URLs printed in the PDF and encoded in the QR, and the URL is persisted per-row in `Certificate.verificationUrl`.
- Backend `FRONTEND_URL` stays supported as a fallback throughout. No task may remove it.
- Frontend has **no test runner today**; Task 1 adds Vitest. Backend already runs Vitest (`npm test` → `vitest run`, config at `backend/vitest.config.ts`, tests in `src/**/*.test.ts`).
- Route ownership lives in `routeOwnership.ts` only. No component may hardcode a brand check to decide whether to render a link.
- The frontend `config/adminPermissions.ts` mirrors `backend/src/config/adminPermissions.ts`. Any change to the catalog shape must be applied to both.
- Commit after every task.

---

# Phase 0 — Brand plumbing (no behaviour change)

Ships to production safely. Nothing changes until `NEXT_PUBLIC_BRAND` is set.

---

### Task 1: Frontend test harness + brand config

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/config/brand.ts`
- Test: `frontend/src/config/__tests__/brand.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type BrandId = "airkrit" | "edulyt"`
  - `type ActiveBrandId = BrandId | "combined"`
  - `interface BrandLink { label: string; href: string }`
  - `interface BrandNavItem { label: string; displayLabel?: string; href: string }`
  - `interface BrandConfig { id: ActiveBrandId; displayName: string; domain: string; siblingDomain: string | null; supportEmail: string; legalEntity: string; logoSrc: string; homeMode: "marketing" | "internships"; navItems: BrandNavItem[]; footerPlatformLinks: BrandLink[] }`
  - `const ACTIVE_BRAND_ID: ActiveBrandId`
  - `const BRAND: BrandConfig`
  - `function getBrandConfig(id: ActiveBrandId): BrandConfig`

- [ ] **Step 1: Add Vitest to the frontend**

```bash
cd frontend
npm install -D vitest@^3 @vitejs/plugin-react@^5 jsdom@^26
```

- [ ] **Step 2: Add the test script**

In `frontend/package.json`, add to `scripts`:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `frontend/vitest.config.ts`**

Mirrors the backend config so both repos test the same way.

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `frontend/src/config/__tests__/brand.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getBrandConfig } from "../brand";

describe("getBrandConfig", () => {
  it("gives airkrit a marketing home and no internships nav entry", () => {
    const b = getBrandConfig("airkrit");
    expect(b.homeMode).toBe("marketing");
    expect(b.navItems.map((n) => n.href)).toEqual(["/programs", "/community"]);
  });

  it("gives edulyt an internships home and only an internships nav entry", () => {
    const b = getBrandConfig("edulyt");
    expect(b.homeMode).toBe("internships");
    expect(b.navItems.map((n) => n.href)).toEqual(["/internships"]);
  });

  it("keeps today's three nav entries for the combined build", () => {
    const b = getBrandConfig("combined");
    expect(b.navItems.map((n) => n.href)).toEqual([
      "/programs",
      "/internships",
      "/community",
    ]);
  });

  it("preserves the mega-menu keys the navbar depends on", () => {
    // Navbar.tsx keys its hover dropdown off `label`, not `href`.
    expect(getBrandConfig("airkrit").navItems[0].label).toBe("courses");
    expect(getBrandConfig("edulyt").navItems[0].label).toBe("internship");
  });

  it("points each brand at its sibling", () => {
    expect(getBrandConfig("airkrit").siblingDomain).toBe("https://www.edulyt.com");
    expect(getBrandConfig("edulyt").siblingDomain).toBe("https://www.airkrit.com");
    expect(getBrandConfig("combined").siblingDomain).toBeNull();
  });
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `cd frontend && npx vitest run src/config/__tests__/brand.test.ts`
Expected: FAIL — `Failed to resolve import "../brand"`

- [ ] **Step 6: Create `frontend/src/config/brand.ts`**

```typescript
/**
 * Single source of truth for per-brand identity. `NEXT_PUBLIC_BRAND` is inlined
 * at build time, so this module is evaluated once per bundle.
 *
 * `combined` is the pre-split behaviour: one site serving everything. It stays
 * the default so that an unset NEXT_PUBLIC_BRAND reproduces today's site
 * exactly. Do not remove it until both domains are live (see Migration.md §8).
 */

export type BrandId = "airkrit" | "edulyt";
export type ActiveBrandId = BrandId | "combined";

export interface BrandLink {
  label: string;
  href: string;
}

export interface BrandNavItem {
  /** Keys the navbar mega-menu logic. Not a display string. */
  label: string;
  displayLabel?: string;
  href: string;
}

export interface BrandConfig {
  id: ActiveBrandId;
  displayName: string;
  domain: string;
  siblingDomain: string | null;
  supportEmail: string;
  legalEntity: string;
  logoSrc: string;
  homeMode: "marketing" | "internships";
  navItems: BrandNavItem[];
  footerPlatformLinks: BrandLink[];
}

const PROGRAMS_NAV: BrandNavItem = {
  label: "courses",
  displayLabel: "Program",
  href: "/programs",
};
const INTERNSHIPS_NAV: BrandNavItem = {
  label: "internship",
  href: "/internships",
};
const COMMUNITY_NAV: BrandNavItem = { label: "community", href: "/community" };

const CONTACT_LINK: BrandLink = { label: "Contact Us", href: "/contact" };
const PROGRAMS_LINK: BrandLink = { label: "Programs", href: "/programs" };
const INTERNSHIPS_LINK: BrandLink = {
  label: "Internships",
  href: "/internships",
};

const AIRKRIT: BrandConfig = {
  id: "airkrit",
  displayName: "Airkrit India",
  domain: "https://www.airkrit.com",
  siblingDomain: "https://www.edulyt.com",
  supportEmail: "support@airkrit.com",
  legalEntity: "Airkrit India",
  logoSrc: "/logo.png",
  homeMode: "marketing",
  navItems: [PROGRAMS_NAV, COMMUNITY_NAV],
  footerPlatformLinks: [PROGRAMS_LINK, CONTACT_LINK],
};

const EDULYT: BrandConfig = {
  id: "edulyt",
  displayName: "Edulyt",
  domain: "https://www.edulyt.com",
  siblingDomain: "https://www.airkrit.com",
  supportEmail: "support@edulyt.com",
  legalEntity: "Edulyt",
  logoSrc: "/edulyt-logo.png",
  homeMode: "internships",
  navItems: [INTERNSHIPS_NAV],
  footerPlatformLinks: [INTERNSHIPS_LINK, CONTACT_LINK],
};

/** Pre-split behaviour: everything on one domain. */
const COMBINED: BrandConfig = {
  ...AIRKRIT,
  id: "combined",
  siblingDomain: null,
  homeMode: "marketing",
  navItems: [PROGRAMS_NAV, INTERNSHIPS_NAV, COMMUNITY_NAV],
  footerPlatformLinks: [PROGRAMS_LINK, INTERNSHIPS_LINK, CONTACT_LINK],
};

const BRANDS: Record<ActiveBrandId, BrandConfig> = {
  airkrit: AIRKRIT,
  edulyt: EDULYT,
  combined: COMBINED,
};

export function getBrandConfig(id: ActiveBrandId): BrandConfig {
  return BRANDS[id];
}

function parseBrandId(raw: string | undefined): ActiveBrandId {
  return raw === "airkrit" || raw === "edulyt" ? raw : "combined";
}

export const ACTIVE_BRAND_ID: ActiveBrandId = parseBrandId(
  process.env.NEXT_PUBLIC_BRAND,
);

export const BRAND: BrandConfig = getBrandConfig(ACTIVE_BRAND_ID);
```

- [ ] **Step 7: Run the test and confirm it passes**

Run: `cd frontend && npx vitest run src/config/__tests__/brand.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 8: Confirm the app still typechecks and builds**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: both succeed. Nothing imports `brand.ts` yet, so the build output is unchanged.

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/config/brand.ts frontend/src/config/__tests__/brand.test.ts
git commit -m "feat(brand): add per-brand config module and frontend test harness"
```

---

### Task 2: Route ownership map

**Files:**
- Create: `frontend/src/config/routeOwnership.ts`
- Test: `frontend/src/config/__tests__/routeOwnership.test.ts`

**Interfaces:**
- Consumes: `BrandId`, `ActiveBrandId` from `@/config/brand`
- Produces:
  - `type RouteOwner = BrandId | "both"`
  - `const ROUTE_OWNERSHIP: ReadonlyArray<readonly [string, RouteOwner]>`
  - `function ownerOf(pathname: string): RouteOwner`
  - `function ownsRoute(brand: ActiveBrandId, pathname: string): boolean`

Longest-prefix matching is the crux: `/dashboard` is owned by `both`, but `/dashboard/internships` is `edulyt`-only. A naive first-match scan gets this wrong.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/config/__tests__/routeOwnership.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ownerOf, ownsRoute, ROUTE_OWNERSHIP } from "../routeOwnership";

describe("ownerOf", () => {
  it("matches the longest prefix, not the first", () => {
    expect(ownerOf("/dashboard")).toBe("both");
    expect(ownerOf("/dashboard/announcements")).toBe("both");
    expect(ownerOf("/dashboard/courses")).toBe("airkrit");
    expect(ownerOf("/dashboard/internships")).toBe("edulyt");
    expect(ownerOf("/dashboard/internships/some-slug/exam")).toBe("edulyt");
  });

  it("does not match a partial path segment", () => {
    // "/programs" must not claim "/programs-archive"
    expect(ownerOf("/programs")).toBe("airkrit");
    expect(ownerOf("/programs/data-science")).toBe("airkrit");
    expect(ownerOf("/programs-archive")).toBe("both");
  });

  it("treats unmapped routes as shared", () => {
    expect(ownerOf("/some/route/nobody/mapped")).toBe("both");
  });

  it("keeps the certificate verification routes shared", () => {
    // Already-issued PDFs and QR codes depend on these. See Migration.md §7.1.
    expect(ownerOf("/verify-certificate/VER-ABC-123")).toBe("both");
    expect(ownerOf("/verify/intern/INT-99")).toBe("both");
  });

  it("assigns the admin split", () => {
    expect(ownerOf("/admin")).toBe("both");
    expect(ownerOf("/admin/users/manage-users")).toBe("both");
    expect(ownerOf("/admin/orders")).toBe("both");
    expect(ownerOf("/admin/courses/analytics")).toBe("airkrit");
    expect(ownerOf("/admin/internships/tasks")).toBe("edulyt");
    expect(ownerOf("/admin/settings/partnership-import")).toBe("airkrit");
    expect(ownerOf("/admin/settings/collaboration-domains")).toBe("airkrit");
    expect(ownerOf("/admin/settings/offer-letter-jobs")).toBe("edulyt");
    expect(ownerOf("/admin/settings/certificate-jobs")).toBe("both");
    expect(ownerOf("/admin/settings/points")).toBe("both");
  });
});

describe("ownsRoute", () => {
  it("lets a brand serve its own and shared routes", () => {
    expect(ownsRoute("airkrit", "/programs")).toBe(true);
    expect(ownsRoute("airkrit", "/profile")).toBe(true);
    expect(ownsRoute("edulyt", "/internships")).toBe(true);
    expect(ownsRoute("edulyt", "/profile")).toBe(true);
  });

  it("blocks a brand from the other's routes", () => {
    expect(ownsRoute("airkrit", "/internships")).toBe(false);
    expect(ownsRoute("airkrit", "/dashboard/internships")).toBe(false);
    expect(ownsRoute("edulyt", "/programs")).toBe(false);
    expect(ownsRoute("edulyt", "/community")).toBe(false);
    expect(ownsRoute("edulyt", "/cart")).toBe(false);
  });

  it("lets the combined build serve everything", () => {
    // This is what makes Phase 0 a no-op.
    expect(ownsRoute("combined", "/internships")).toBe(true);
    expect(ownsRoute("combined", "/programs")).toBe(true);
    expect(ownsRoute("combined", "/admin/internships/tasks")).toBe(true);
  });

  it("gives both brands the root route", () => {
    expect(ownsRoute("airkrit", "/")).toBe(true);
    expect(ownsRoute("edulyt", "/")).toBe(true);
  });
});

describe("ROUTE_OWNERSHIP", () => {
  it("has no duplicate prefixes", () => {
    const prefixes = ROUTE_OWNERSHIP.map(([p]) => p);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("declares every prefix with a leading slash and no trailing slash", () => {
    for (const [prefix] of ROUTE_OWNERSHIP) {
      expect(prefix.startsWith("/")).toBe(true);
      if (prefix !== "/") expect(prefix.endsWith("/")).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd frontend && npx vitest run src/config/__tests__/routeOwnership.test.ts`
Expected: FAIL — `Failed to resolve import "../routeOwnership"`

- [ ] **Step 3: Create `frontend/src/config/routeOwnership.ts`**

```typescript
import type { ActiveBrandId, BrandId } from "@/config/brand";

/**
 * Which brand serves which route. THE single source of truth for the
 * middleware 404 gate, nav/footer link rendering, sitemap and robots.
 *
 * The risk this file exists to prevent is leakage: a link rendered to a route
 * the brand does not serve. Never hardcode a brand check to hide a link —
 * ask this map instead.
 *
 * Unmapped routes default to "both", so adding a route can never accidentally
 * 404 it. Narrow deliberately by adding an entry.
 */

export type RouteOwner = BrandId | "both";

export const ROUTE_OWNERSHIP: ReadonlyArray<readonly [string, RouteOwner]> = [
  // --- Airkrit: courses, community, commerce ---
  ["/programs", "airkrit"],
  ["/community", "airkrit"],
  ["/cart", "airkrit"],
  ["/live-class", "airkrit"],
  ["/instructor", "airkrit"],
  ["/dashboard/courses", "airkrit"],
  ["/dashboard/live-classes", "airkrit"],
  ["/admin/courses", "airkrit"],
  ["/admin/community", "airkrit"],
  ["/admin/coupons", "airkrit"],
  ["/admin/testimonials", "airkrit"],
  ["/admin/settings/home-page", "airkrit"],
  // Course tooling despite the generic names — verified by reference counts.
  ["/admin/settings/partnership-import", "airkrit"],
  ["/admin/settings/collaboration-domains", "airkrit"],
  ["/admin/settings/collaboration-jobs", "airkrit"],

  // --- Edulyt: internships ---
  ["/internships", "edulyt"],
  ["/live-meeting", "edulyt"],
  ["/dashboard/internships", "edulyt"],
  ["/dashboard/applications", "edulyt"],
  ["/admin/internships", "edulyt"],
  ["/admin/settings/offer-letter-jobs", "edulyt"],

  // --- Explicitly shared. Listed for documentation and to guard against a
  // future broader prefix accidentally capturing them. ---
  ["/", "both"],
  ["/verify-certificate", "both"], // NEVER narrow — see Migration.md §7.1
  ["/verify/intern", "both"], //      NEVER narrow — see Migration.md §7.1
  ["/login", "both"],
  ["/register", "both"],
  ["/forgot-password", "both"],
  ["/reset-password", "both"],
  ["/profile", "both"],
  ["/settings", "both"],
  ["/onboarding", "both"],
  ["/auth-redirect", "both"],
  ["/mentor", "both"],
  ["/payment", "both"],
  ["/paytm-redirect", "both"],
  ["/partner", "both"],
  ["/dashboard", "both"],
  ["/admin", "both"],
] as const;

/** True when `pathname` is exactly `prefix` or a path segment beneath it. */
function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") return pathname === "/";
  if (pathname === prefix) return true;
  return pathname.startsWith(`${prefix}/`);
}

/**
 * Owner of the longest matching prefix. Longest-match matters: "/dashboard" is
 * shared but "/dashboard/internships" belongs to edulyt alone.
 */
export function ownerOf(pathname: string): RouteOwner {
  let bestPrefixLength = -1;
  let owner: RouteOwner = "both";

  for (const [prefix, prefixOwner] of ROUTE_OWNERSHIP) {
    if (matchesPrefix(pathname, prefix) && prefix.length > bestPrefixLength) {
      bestPrefixLength = prefix.length;
      owner = prefixOwner;
    }
  }

  return owner;
}

export function ownsRoute(brand: ActiveBrandId, pathname: string): boolean {
  if (brand === "combined") return true;
  const owner = ownerOf(pathname);
  return owner === "both" || owner === brand;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd frontend && npx vitest run src/config/__tests__/routeOwnership.test.ts`
Expected: PASS — all tests, including both `ROUTE_OWNERSHIP` invariants.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/config/routeOwnership.ts frontend/src/config/__tests__/routeOwnership.test.ts
git commit -m "feat(brand): add route ownership map with longest-prefix resolution"
```

---

### Task 3: Drive navbar and footer from brand config, with a leakage guard

**Files:**
- Modify: `frontend/src/components/shared/Navbar/Navbar.tsx:93-109`
- Modify: `frontend/src/components/shared/Footer/Footer.tsx:49-64`
- Test: `frontend/src/config/__tests__/linkLeakage.test.ts`

**Interfaces:**
- Consumes: `BRAND`, `getBrandConfig`, `ActiveBrandId` from `@/config/brand`; `ownsRoute` from `@/config/routeOwnership`
- Produces: nothing new — this task rewires existing components.

The leakage test is the safety net for the whole gating approach. It asserts that no brand config can declare a link to a route that brand does not serve.

- [ ] **Step 1: Write the failing leakage test**

Create `frontend/src/config/__tests__/linkLeakage.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getBrandConfig, type ActiveBrandId } from "../brand";
import { ownsRoute } from "../routeOwnership";

const BRANDS: ActiveBrandId[] = ["airkrit", "edulyt", "combined"];

describe("brand link leakage", () => {
  it.each(BRANDS)("%s renders no nav link to a route it does not own", (id) => {
    const brand = getBrandConfig(id);
    const leaked = brand.navItems
      .map((n) => n.href)
      .filter((href) => !ownsRoute(id, href));
    expect(leaked).toEqual([]);
  });

  it.each(BRANDS)("%s renders no footer link to a route it does not own", (id) => {
    const brand = getBrandConfig(id);
    const leaked = brand.footerPlatformLinks
      .map((l) => l.href)
      .filter((href) => !ownsRoute(id, href));
    expect(leaked).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it passes already**

Run: `cd frontend && npx vitest run src/config/__tests__/linkLeakage.test.ts`
Expected: PASS. Task 1's configs are already correct — this test locks that in so a future edit cannot regress it. If it fails, the brand config from Task 1 is wrong; fix `brand.ts`, not the test.

- [ ] **Step 3: Point the navbar at the brand config**

In `frontend/src/components/shared/Navbar/Navbar.tsx`, add the import:

```typescript
import { BRAND } from "@/config/brand";
```

Replace the hardcoded `navItems` array (lines 93–109) with:

```typescript
  const navItems: NavItem[] = BRAND.navItems.map((item) => ({
    ...item,
    count:
      item.label === "courses"
        ? coursesCount
        : item.label === "internship"
          ? internshipsCount
          : undefined,
  }));
```

Leave `navLinkHasHoverDropdown` untouched — it keys off `label`, and the brand configs preserve the `"courses"` / `"internship"` keys exactly.

- [ ] **Step 4: Point the footer at the brand config**

In `frontend/src/components/shared/Footer/Footer.tsx`, add the import:

```typescript
import { BRAND } from "@/config/brand";
```

Replace the `platform` array inside `footerLinks` with:

```typescript
    platform: BRAND.footerPlatformLinks,
```

Leave `support` and `company` as they are — those routes are shared by both brands.

- [ ] **Step 5: Verify the combined build is byte-identical in behaviour**

Run: `cd frontend && npx tsc --noEmit && npm run test && npm run build`
Expected: all pass.

Then run `npm run dev` with `NEXT_PUBLIC_BRAND` unset and confirm by eye:
- navbar shows **Program, Internships, Community** (three entries, unchanged)
- the Program and Internship mega-menus still open on hover
- footer Platform column shows **Programs, Internships, Contact Us**

This is the moment Phase 0's no-op promise is proven. Do not proceed if anything differs.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/shared/Navbar/Navbar.tsx frontend/src/components/shared/Footer/Footer.tsx frontend/src/config/__tests__/linkLeakage.test.ts
git commit -m "feat(brand): source navbar and footer links from brand config"
```

---

### Task 4: Tag the admin permission catalog with brand ownership

**Files:**
- Modify: `frontend/src/config/adminPermissions.ts`
- Modify: `backend/src/config/adminPermissions.ts` (keep the mirror in sync)
- Test: `frontend/src/config/__tests__/adminBrandScope.test.ts`

**Interfaces:**
- Consumes: `RouteOwner`, `ownerOf` from `@/config/routeOwnership`; `ActiveBrandId` from `@/config/brand`
- Produces:
  - `function visibleSections(brand: ActiveBrandId): AdminSection[]` — sections with pages filtered to those the brand owns, dropping sections left empty.

The sidebar already derives from `ADMIN_PERMISSION_CATALOG` via `canSeeHref`. Brand scoping belongs in the catalog so the sidebar, the access-management screen and `firstAccessibleHref` all narrow together rather than drifting.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/config/__tests__/adminBrandScope.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { visibleSections } from "../adminPermissions";

const hrefsFor = (brand: Parameters<typeof visibleSections>[0]) =>
  visibleSections(brand).flatMap((s) => s.pages.map((p) => p.href));

describe("visibleSections", () => {
  it("hides internship pages from airkrit", () => {
    const hrefs = hrefsFor("airkrit");
    expect(hrefs).toContain("/admin/courses/analytics");
    expect(hrefs).not.toContain("/admin/internships/analytics");
    expect(hrefs).not.toContain("/admin/settings/offer-letter-jobs");
  });

  it("hides course and community pages from edulyt", () => {
    const hrefs = hrefsFor("edulyt");
    expect(hrefs).toContain("/admin/internships/analytics");
    expect(hrefs).not.toContain("/admin/courses/analytics");
    expect(hrefs).not.toContain("/admin/community/moderation");
    expect(hrefs).not.toContain("/admin/settings/partnership-import");
  });

  it("keeps shared settings on both", () => {
    for (const brand of ["airkrit", "edulyt"] as const) {
      const hrefs = hrefsFor(brand);
      expect(hrefs).toContain("/admin/users/manage-users");
      expect(hrefs).toContain("/admin/orders");
      expect(hrefs).toContain("/admin/settings/certificate-jobs");
      expect(hrefs).toContain("/admin/settings/points");
      expect(hrefs).toContain("/admin/settings/colleges");
    }
  });

  it("drops a section whose every page is filtered out", () => {
    const keys = visibleSections("edulyt").map((s) => s.key);
    expect(keys).not.toContain("courses");
    expect(keys).not.toContain("community");
    expect(keys).toContain("settings");
  });

  it("returns the whole catalog for the combined build", () => {
    const hrefs = hrefsFor("combined");
    expect(hrefs).toContain("/admin/courses/analytics");
    expect(hrefs).toContain("/admin/internships/analytics");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd frontend && npx vitest run src/config/__tests__/adminBrandScope.test.ts`
Expected: FAIL — `visibleSections is not a function`

- [ ] **Step 3: Add `visibleSections` to `frontend/src/config/adminPermissions.ts`**

Append to the file, after `firstAccessibleHref`:

```typescript
/**
 * Catalog narrowed to one brand. Derives ownership from the route map rather
 * than a second hand-maintained list, so the sidebar and the middleware gate
 * can never disagree about what a brand serves.
 *
 * Sections left with no visible pages are dropped entirely.
 */
export const visibleSections = (brand: ActiveBrandId): AdminSection[] => {
  if (brand === "combined") return ADMIN_PERMISSION_CATALOG;

  return ADMIN_PERMISSION_CATALOG.map((section) => ({
    ...section,
    pages: section.pages.filter((page) => ownsRoute(brand, page.href)),
  })).filter((section) => section.pages.length > 0);
};
```

Add the imports at the top of the file:

```typescript
import type { ActiveBrandId } from "@/config/brand";
import { ownsRoute } from "@/config/routeOwnership";
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd frontend && npx vitest run src/config/__tests__/adminBrandScope.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Narrow the sidebar and the landing redirect**

In `frontend/src/app/admin/components/Sidebar.tsx`, add:

```typescript
import { BRAND } from "@/config/brand";
import { visibleSections } from "@/config/adminPermissions";
```

Then narrow `canSeeHref` so brand scope composes with the existing RBAC check rather than replacing it:

```typescript
  const brandHrefs = React.useMemo(
    () =>
      new Set(
        visibleSections(BRAND.id).flatMap((s) => s.pages.map((p) => p.href)),
      ),
    [],
  );

  const canSeeHref = (href: string): boolean => {
    if (!brandHrefs.has(href)) return false;
    const key = resolvePageKeyFromPath(href);
    return key ? canAccessPage(permissions, isSuperAdmin, key) : false;
  };
```

**No other sidebar change is needed.** `visibleMenuItems` (Sidebar.tsx:242–250) already filters each `submenu` through `canSeeHref` and drops any section left with no visible children:

```typescript
  const visibleMenuItems: MenuItem[] = menuItems
    .map((item) => {
      if (item.submenu && item.submenu.length > 0) {
        const submenu = item.submenu.filter((s) => canSeeHref(s.href));
        return submenu.length > 0 ? { ...item, submenu } : null;
      }
      return canSeeHref(item.href) ? item : null;
    })
    .filter((item): item is MenuItem => item !== null);
```

Narrowing `canSeeHref` therefore propagates to both levels automatically. Do not add a second filter.

Note the super-admin `/admin/access` entry injected just below this block is not in the catalog and is owned by `both`, so it correctly remains on each brand.

In `frontend/src/config/adminPermissions.ts`, narrow `firstAccessibleHref` so a brand-scoped admin never lands on a 404:

```typescript
export const firstAccessibleHref = (
  permissions: readonly string[],
  isSuperAdmin: boolean,
  brand: ActiveBrandId = "combined",
): string | null => {
  for (const section of visibleSections(brand)) {
    for (const page of section.pages) {
      if (canAccessPage(permissions, isSuperAdmin, page.key)) return page.href;
    }
  }
  return null;
};
```

The `brand` parameter defaults to `"combined"`, so existing call sites keep working unchanged. Find them and pass `BRAND.id`:

Run: `cd frontend && npx grep -rn "firstAccessibleHref" src/` — update each call site.

- [ ] **Step 6: Mirror the change in the backend catalog**

`backend/src/config/adminPermissions.ts` is the authority for server-side RBAC and must keep the same page keys. This task adds **no** brand field to the catalog data — ownership is derived from the route map on the frontend only — so verify the backend file needs no change:

Run: `cd backend && npx grep -n "visibleSections\|ownsRoute" src/config/adminPermissions.ts`
Expected: no matches. The mirror stays in sync because the catalog *data* is untouched. Note this in the commit message.

- [ ] **Step 7: Verify combined behaviour is unchanged**

Run: `cd frontend && npx tsc --noEmit && npm run test && npm run build`
Expected: all pass. With `NEXT_PUBLIC_BRAND` unset, `visibleSections("combined")` returns the full catalog, so the sidebar is identical to today.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/config/adminPermissions.ts frontend/src/app/admin/components/Sidebar.tsx frontend/src/config/__tests__/adminBrandScope.test.ts
git commit -m "feat(brand): scope admin catalog and sidebar by brand ownership"
```

---

### Task 5: Middleware ownership gate

**Files:**
- Create: `frontend/src/app/route-unavailable/page.tsx`
- Modify: `frontend/src/proxy.ts`

**Interfaces:**
- Consumes: `BRAND` from `@/config/brand`; `ownsRoute` from `@/config/routeOwnership`
- Produces: nothing new.

Three things matter here. The gate must run **before** the `withAuth` authorized callback, or an unowned protected route bounces to login instead of 404ing. The `matcher` must be widened, or unowned public routes like `/internships` never reach the middleware at all. And middleware cannot reliably set a 404 status on a rewrite — so it rewrites to a route that calls `notFound()`, which produces both the correct status and the existing branded 404 UI from `app/not-found.tsx`.

- [ ] **Step 1: Create the 404 target route**

Create `frontend/src/app/route-unavailable/page.tsx`:

```tsx
import { notFound } from "next/navigation";

/**
 * Rewrite target for routes the active brand does not serve. Calling
 * notFound() renders app/not-found.tsx with a genuine 404 status — a bare
 * NextResponse.rewrite cannot set the status reliably from middleware.
 */
export default function RouteUnavailable(): never {
  notFound();
}
```

- [ ] **Step 2: Rewrite `frontend/src/proxy.ts`**

Replace the whole file:

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { BRAND } from "@/config/brand";
import { ownsRoute } from "@/config/routeOwnership";

export default withAuth(
  function proxy(req) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.nextauth.token;

    // Routes this brand does not serve must 404, not redirect. A redirect
    // would leak the other domain's URL structure and keep the path indexable.
    // /route-unavailable calls notFound(), which yields a real 404 status.
    if (!ownsRoute(BRAND.id, pathname)) {
      return NextResponse.rewrite(new URL("/route-unavailable", req.url));
    }

    // If user is authenticated and trying to access auth pages, redirect to role home / callbackUrl
    if (
      token &&
      (pathname.startsWith("/login") || pathname.startsWith("/register"))
    ) {
      const ut = (token as { userType?: string })?.userType;
      const dest = getPostLoginRedirectPath(
        { userType: ut },
        searchParams.get("callbackUrl"),
      );
      return NextResponse.redirect(new URL(dest, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // An unowned route must reach the proxy function above so it can 404.
        // Returning false here would bounce it to /login instead.
        if (!ownsRoute(BRAND.id, pathname)) {
          return true;
        }

        // Allow access to auth pages without token
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Require authentication for protected routes
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/profile") ||
          pathname.startsWith("/settings") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/instructor") ||
          pathname.startsWith("/cart")
        ) {
          return !!token;
        }

        // Allow public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/instructor/:path*",
    "/cart/:path*",
    "/login",
    "/register",
    // Brand-gated public routes. Without these the middleware never runs for
    // them and an unowned public route would render normally.
    "/programs/:path*",
    "/community/:path*",
    "/internships/:path*",
    "/live-class/:path*",
    "/live-meeting/:path*",
  ],
};
```

- [ ] **Step 3: Verify the combined build still serves everything**

Run: `cd frontend && npm run build && npm run start`

With `NEXT_PUBLIC_BRAND` unset, request each and confirm **200**:

```bash
curl -s -o /dev/null -w "%{http_code} /programs\n"     http://localhost:3000/programs
curl -s -o /dev/null -w "%{http_code} /internships\n"  http://localhost:3000/internships
curl -s -o /dev/null -w "%{http_code} /community\n"    http://localhost:3000/community
```

Expected: `200` for all three. Phase 0 remains a no-op.

- [ ] **Step 4: Verify the airkrit gate**

Stop the server. Rebuild with the brand set and re-request:

```bash
cd frontend && NEXT_PUBLIC_BRAND=airkrit npm run build && npm run start
```

```bash
curl -s -o /dev/null -w "%{http_code} /programs\n"           http://localhost:3000/programs
curl -s -o /dev/null -w "%{http_code} /internships\n"        http://localhost:3000/internships
curl -s -o /dev/null -w "%{http_code} /verify-certificate/X\n" http://localhost:3000/verify-certificate/X
```

Expected: `200 /programs`, **`404 /internships`**, `200 /verify-certificate/X`.

The third assertion is the one that protects certificates already in circulation. Do not proceed if it is not 200.

- [ ] **Step 5: Verify the edulyt gate**

```bash
cd frontend && NEXT_PUBLIC_BRAND=edulyt npm run build && npm run start
```

```bash
curl -s -o /dev/null -w "%{http_code} /internships\n"        http://localhost:3000/internships
curl -s -o /dev/null -w "%{http_code} /programs\n"           http://localhost:3000/programs
curl -s -o /dev/null -w "%{http_code} /community\n"          http://localhost:3000/community
curl -s -o /dev/null -w "%{http_code} /verify-certificate/X\n" http://localhost:3000/verify-certificate/X
```

Expected: `200`, `404`, `404`, `200`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/proxy.ts frontend/src/app/route-unavailable/page.tsx
git commit -m "feat(brand): 404 routes the active brand does not own"
```

---

### Task 6: Brand-aware root page, metadata, sitemap and robots

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/layout.tsx:15-50`
- Create: `frontend/src/app/sitemap.ts`
- Create: `frontend/src/app/robots.ts`

**Interfaces:**
- Consumes: `BRAND` from `@/config/brand`; `ROUTE_OWNERSHIP`, `ownsRoute` from `@/config/routeOwnership`
- Produces: nothing new.

- [ ] **Step 1: Branch the root page on brand**

Replace `frontend/src/app/page.tsx`:

```typescript
import Homepage from "./(pages)/(home)/Homepage";
import InternshipsPage from "./(pages)/internships/page";
import { BRAND } from "@/config/brand";

const HomePage = () => {
  // edulyt has no marketing home — the internships listing IS the home page.
  // Rendered in place rather than redirected, so "/" keeps its own ranking
  // signal instead of spending a hop. See Migration.md §4.
  if (BRAND.homeMode === "internships") {
    return <InternshipsPage />;
  }
  return <Homepage />;
};

export default HomePage;
```

If `InternshipsPage` takes route props (`params` / `searchParams`), extract its body into a prop-less `InternshipsListing` component in `(pages)/internships/components/` and render that from both places instead. Check the signature before writing this.

- [ ] **Step 2: Make metadata brand-aware**

In `frontend/src/app/layout.tsx`, add the import and replace the `metadata` export:

```typescript
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: BRAND.displayName,
  description: "Educational platform for learning and growth",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? BRAND.domain
        : "http://localhost:3000"),
  ),
  openGraph: {
    title: BRAND.displayName,
    description: "Educational platform for learning and growth",
    url: BRAND.domain,
    siteName: BRAND.displayName,
    type: "website",
    images: [{ url: `${BRAND.domain}${BRAND.logoSrc}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.displayName,
    description: "Educational platform for learning and growth",
    images: [{ url: `${BRAND.domain}${BRAND.logoSrc}`, width: 1200, height: 630 }],
  },
};
```

Note this also fixes a latent bug in the existing code: `process.env.NEXT_PUBLIC_APP_URL || process.env.NODE_ENV === "production" ? ... : ...` parses as `(A || B) ? ... : ...`, so the ternary never selected the localhost branch when `NEXT_PUBLIC_APP_URL` was set. The parenthesisation above is correct.

- [ ] **Step 3: Create `frontend/src/app/sitemap.ts`**

```typescript
import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";
import { ownsRoute } from "@/config/routeOwnership";

/** Public, indexable prefixes. Authed and admin areas are deliberately absent. */
const PUBLIC_PREFIXES = [
  "/",
  "/programs",
  "/community",
  "/internships",
  "/mentor",
  "/about",
  "/faq",
  "/privacy-policy",
  "/terms-of-use",
  "/security-policy",
  "/cancellation-refund-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PREFIXES.filter((path) => ownsRoute(BRAND.id, path)).map(
    (path) => ({
      url: `${BRAND.domain}${path === "/" ? "" : path}`,
      lastModified: new Date(),
    }),
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/robots.ts`**

```typescript
import type { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/profile", "/settings", "/cart", "/api"],
    },
    sitemap: `${BRAND.domain}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Verify per brand**

```bash
cd frontend && NEXT_PUBLIC_BRAND=edulyt npm run build && npm run start
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
```

Expected: sitemap lists only edulyt-owned URLs on `https://www.edulyt.com` — no `/programs`, no `/community`. Then confirm `curl -s http://localhost:3000/ | head -c 500` shows internship listing markup, not the marketing home.

Repeat with `NEXT_PUBLIC_BRAND=airkrit` and confirm the inverse.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/app/layout.tsx frontend/src/app/sitemap.ts frontend/src/app/robots.ts
git commit -m "feat(brand): brand-aware root page, metadata, sitemap and robots"
```

---

# Phase 1 — Backend brand-aware URLs

Additive. `AIRKRIT_URL` and `EDULYT_URL` both point at the current live domain until Phase 3, so behaviour is unchanged.

---

### Task 7: `resolveFrontendUrl` helper

**Files:**
- Create: `backend/src/config/brandUrls.ts`
- Test: `backend/src/config/__tests__/brandUrls.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type BackendBrand = "airkrit" | "edulyt"`
  - `function resolveFrontendUrl(brand: BackendBrand | undefined): string`
  - `function brandForCertificateType(type: string): BackendBrand`

- [ ] **Step 1: Write the failing test**

Create `backend/src/config/__tests__/brandUrls.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveFrontendUrl, brandForCertificateType } from "../brandUrls";

const ENV = { ...process.env };

beforeEach(() => {
  process.env.AIRKRIT_URL = "https://www.airkrit.com";
  process.env.EDULYT_URL = "https://www.edulyt.com";
  process.env.FRONTEND_URL = "https://legacy.example.com";
});
afterEach(() => {
  process.env = { ...ENV };
});

describe("resolveFrontendUrl", () => {
  it("resolves each brand to its own domain", () => {
    expect(resolveFrontendUrl("airkrit")).toBe("https://www.airkrit.com");
    expect(resolveFrontendUrl("edulyt")).toBe("https://www.edulyt.com");
  });

  it("falls back to FRONTEND_URL when the brand is unknown", () => {
    expect(resolveFrontendUrl(undefined)).toBe("https://legacy.example.com");
  });

  it("falls back to FRONTEND_URL when the brand var is unset", () => {
    delete process.env.EDULYT_URL;
    expect(resolveFrontendUrl("edulyt")).toBe("https://legacy.example.com");
  });

  it("falls back to localhost when nothing is configured", () => {
    delete process.env.AIRKRIT_URL;
    delete process.env.FRONTEND_URL;
    expect(resolveFrontendUrl("airkrit")).toBe("http://localhost:3000");
  });

  it("strips a trailing slash so callers can concatenate safely", () => {
    process.env.AIRKRIT_URL = "https://www.airkrit.com/";
    expect(resolveFrontendUrl("airkrit")).toBe("https://www.airkrit.com");
  });
});

describe("brandForCertificateType", () => {
  // Values come from the `type` enum in certificate.schema.ts:
  //   ["course", "internship", "lor"]
  it("routes internship artefacts to edulyt", () => {
    expect(brandForCertificateType("internship")).toBe("edulyt");
    expect(brandForCertificateType("lor")).toBe("edulyt");
  });

  it("routes course certificates to airkrit", () => {
    expect(brandForCertificateType("course")).toBe("airkrit");
  });

  it("defaults an unrecognised type to airkrit, the incumbent domain", () => {
    expect(brandForCertificateType("something-new")).toBe("airkrit");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx vitest run src/config/__tests__/brandUrls.test.ts`
Expected: FAIL — cannot resolve `../brandUrls`

- [ ] **Step 3: Create `backend/src/config/brandUrls.ts`**

```typescript
/**
 * The backend is one deployment serving two frontends. Any URL it emits into
 * an email, PDF, QR code or payment callback must point at the right domain.
 *
 * FRONTEND_URL remains the fallback for every path that has not yet been made
 * brand-aware, and for local development. Do not remove it.
 */

export type BackendBrand = "airkrit" | "edulyt";

const ENV_VAR_BY_BRAND: Record<BackendBrand, string> = {
  airkrit: "AIRKRIT_URL",
  edulyt: "EDULYT_URL",
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

export function resolveFrontendUrl(brand: BackendBrand | undefined): string {
  const specific = brand ? process.env[ENV_VAR_BY_BRAND[brand]] : undefined;
  const url = specific || process.env.FRONTEND_URL || "http://localhost:3000";
  return stripTrailingSlash(url);
}

/** Matches the `type` enum in certificate.schema.ts: ["course", "internship", "lor"]. */
const EDULYT_CERTIFICATE_TYPES = new Set(["internship", "lor"]);

/**
 * Which domain verifies a given artefact. Unrecognised types fall to airkrit —
 * the incumbent domain — so a new certificate type can never silently point at
 * a host that does not serve it.
 */
export function brandForCertificateType(type: string): BackendBrand {
  return EDULYT_CERTIFICATE_TYPES.has(type) ? "edulyt" : "airkrit";
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd backend && npx vitest run src/config/__tests__/brandUrls.test.ts`
Expected: PASS — 8 tests

- [ ] **Step 5: Re-confirm the certificate type enum has not drifted**

```bash
cd backend && npx grep -n -A3 "enum:" src/models/certificate.schema.ts | head -8
```

Expected: `enum: ["course", "internship", "lor"]` on the `type` field. If it has gained a value since this plan was written, add it to `EDULYT_CERTIFICATE_TYPES` (if it is an internship artefact) and to the test. A mismatch silently sends internship certificates to airkrit.com.

- [ ] **Step 6: Commit**

```bash
git add backend/src/config/brandUrls.ts backend/src/config/__tests__/brandUrls.test.ts
git commit -m "feat(brand): add per-brand frontend URL resolution"
```

---

### Task 8: Migrate certificate URL call sites

**Files:**
- Modify: `backend/src/models/certificate.schema.ts:176-180`
- Modify: `backend/src/services/certificate.services.ts:141`, `:485`, `:606`
- Modify: `backend/src/workers/certificate.worker.ts`
- Modify: `backend/src/workers/offerLetter.worker.ts`
- Test: `backend/src/config/__tests__/brandUrls.test.ts` (extend)

**Interfaces:**
- Consumes: `resolveFrontendUrl`, `brandForCertificateType` from `@/config/brandUrls`
- Produces: nothing new.

`Certificate.verificationUrl` is **persisted per row**. Existing rows keep their current URL and must not be rewritten — airkrit.com serves them forever. This task only changes what *new* rows get.

- [ ] **Step 1: Update the schema pre-save hook**

In `backend/src/models/certificate.schema.ts`, add the import:

```typescript
import { resolveFrontendUrl, brandForCertificateType } from "../config/brandUrls";
```

Replace the verification-URL block (lines ~176–180):

```typescript
  // Auto-generate verification URL if not provided. Existing rows keep the URL
  // they were issued with — airkrit.com serves those forever (Migration.md §7.1).
  if (!this.verificationUrl && this.verificationCode) {
    const frontendUrl = resolveFrontendUrl(brandForCertificateType(this.type));
    this.verificationUrl = `${frontendUrl}/verify-certificate/${this.verificationCode}`;
  }
```

Confirm the field holding the certificate kind is actually named `type` on this schema before writing it. If it differs, use the real field name.

- [ ] **Step 2: Update the three service call sites**

In `backend/src/services/certificate.services.ts`, add the same import. Each site has an unambiguous brand — no threading required.

**Line 141** — inside the course certificate path (the enclosing function reads `course.instructor` just above). Replace:

```typescript
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
```

with:

```typescript
const frontendUrl = resolveFrontendUrl("airkrit");
```

**Line 485** — inside the internship certificate path (preceded by `loadInternshipCertificateContext(enrollmentId)`). Replace the same line with:

```typescript
const frontendUrl = resolveFrontendUrl("edulyt");
```

**Line 606** — the regeneration path, which can regenerate either kind. `oldCertificate` is already in scope a few lines above:

```typescript
const frontendUrl = resolveFrontendUrl(brandForCertificateType(oldCertificate.type));
```

Only line 606 needs the `brandForCertificateType` import; lines 141 and 485 need `resolveFrontendUrl` alone.

- [ ] **Step 3: Update both workers**

In `backend/src/workers/certificate.worker.ts`, replace any `process.env.FRONTEND_URL` with `resolveFrontendUrl(brandForCertificateType(job.data.type))`, using the real job payload field.

In `backend/src/workers/offerLetter.worker.ts`, offer letters are always internship artefacts:

```typescript
const frontendUrl = resolveFrontendUrl("edulyt");
```

- [ ] **Step 4: Confirm no certificate call site still reads the raw env var**

```bash
cd backend && npx grep -rn "FRONTEND_URL" src/models/certificate.schema.ts src/services/certificate.services.ts src/workers/certificate.worker.ts src/workers/offerLetter.worker.ts
```

Expected: no matches.

- [ ] **Step 5: Run the full backend suite**

Run: `cd backend && npm test && npm run build`
Expected: all existing suites pass, build succeeds.

- [ ] **Step 6: Verify a real certificate end to end**

With `AIRKRIT_URL` and `EDULYT_URL` both set to the current live domain, issue one course certificate and one internship certificate in a non-production environment. Confirm:
- the course certificate's `verificationUrl` resolves to the airkrit host
- the internship certificate's resolves to the edulyt host
- both `/verify-certificate/<code>` pages load

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/certificate.schema.ts backend/src/services/certificate.services.ts backend/src/workers/certificate.worker.ts backend/src/workers/offerLetter.worker.ts
git commit -m "feat(brand): resolve certificate verification URLs per brand"
```

---

### Task 9: Migrate the remaining backend URL call sites

**Files:**
- Modify: `backend/src/services/live-classes.services.ts`
- Modify: `backend/src/services/liveMeeting.services.ts`
- Modify: `backend/src/services/payments/orderFlow.ts`
- Modify: `backend/src/services/cron.services.ts`
- Modify: `backend/src/scripts/regenerate-internship-certificates.ts`
- Modify: `backend/src/scripts/seed-sample-certificates.ts`

**Interfaces:**
- Consumes: `resolveFrontendUrl` from `@/config/brandUrls`
- Produces: nothing new.

- [ ] **Step 1: Fix the unambiguous services**

`live-classes.services.ts` serves course live classes → always airkrit:

```typescript
const frontendUrl = resolveFrontendUrl("airkrit");
```

`liveMeeting.services.ts` serves internship live meetings → always edulyt:

```typescript
const frontendUrl = resolveFrontendUrl("edulyt");
```

Both scripts are internship-only → `resolveFrontendUrl("edulyt")`.

- [ ] **Step 2: Handle payment return URLs**

**This is the highest-risk change in the plan** — a wrong return URL breaks checkout silently. Write the test first.

`backend/src/services/payments/__tests__/orderFlow.test.ts` already exists. Add a case asserting the callback host for each order kind, following the existing file's setup style, then make it pass.

The order schema carries both `courseId` and `internshipId` (order.schema.ts:18 and :26), so the discriminator is whether `internshipId` is set. In `beginGatewayCheckout`, replace line 108:

```typescript
  const callbackUrl = `${process.env.FRONTEND_URL}/payment/status/${orderId}?token=${paymentToken}`;
```

with:

```typescript
  const frontendUrl = resolveFrontendUrl(order.internshipId ? "edulyt" : "airkrit");
  const callbackUrl = `${frontendUrl}/payment/status/${orderId}?token=${paymentToken}`;
```

This also removes a latent bug: the original interpolates `process.env.FRONTEND_URL` with **no fallback**, so an unset var silently produces `undefined/payment/status/...`. `resolveFrontendUrl` always returns a usable origin.

- [ ] **Step 3: Handle cron reminders**

In `backend/src/services/cron.services.ts`, each reminder job targets a known entity type. Resolve per job rather than once at module scope — read each usage and pass the matching brand.

- [ ] **Step 4: Confirm only intentional fallbacks remain**

```bash
cd backend && npx grep -rn "FRONTEND_URL" src/ | grep -v "config/brandUrls.ts"
```

Expected: only `src/controllers/auth.controller.ts` (handled in Task 10). Anything else is a missed call site.

- [ ] **Step 5: Run the suite**

Run: `cd backend && npm test && npm run build`
Expected: all pass, including the new orderFlow assertions.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services backend/src/scripts
git commit -m "feat(brand): resolve live-class, meeting, payment and cron URLs per brand"
```

---

### Task 10: `X-Brand` header for request-scoped brand

**Files:**
- Modify: `frontend/src/configs/apiConfig.ts`
- Create: `backend/src/middleware/brand.middleware.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/src/controllers/auth.controller.ts:524-531`
- Test: `backend/src/middleware/__tests__/brand.middleware.test.ts`

**Interfaces:**
- Consumes: `BackendBrand`, `resolveFrontendUrl` from `@/config/brandUrls`; `BRAND` from `@/config/brand`
- Produces:
  - `function brandFromRequest(req: Request): BackendBrand | undefined`
  - Express `Request.brand?: BackendBrand`

Auth emails are the one case where brand cannot be derived from the data — a password reset belongs to whichever site the user was on. The frontend must say.

- [ ] **Step 1: Write the failing middleware test**

Create `backend/src/middleware/__tests__/brand.middleware.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { brandFromRequest } from "../brand.middleware";

const req = (headers: Record<string, string>) => ({ headers }) as any;

describe("brandFromRequest", () => {
  it("reads a valid brand header", () => {
    expect(brandFromRequest(req({ "x-brand": "airkrit" }))).toBe("airkrit");
    expect(brandFromRequest(req({ "x-brand": "edulyt" }))).toBe("edulyt");
  });

  it("ignores an unknown value rather than trusting it", () => {
    expect(brandFromRequest(req({ "x-brand": "evil.com" }))).toBeUndefined();
  });

  it("returns undefined when the header is absent", () => {
    expect(brandFromRequest(req({}))).toBeUndefined();
  });

  it("is case-insensitive on the value", () => {
    expect(brandFromRequest(req({ "x-brand": "EDULYT" }))).toBe("edulyt");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd backend && npx vitest run src/middleware/__tests__/brand.middleware.test.ts`
Expected: FAIL — cannot resolve `../brand.middleware`

- [ ] **Step 3: Create `backend/src/middleware/brand.middleware.ts`**

```typescript
import type { Request, Response, NextFunction } from "express";
import type { BackendBrand } from "../config/brandUrls";

declare global {
  namespace Express {
    interface Request {
      brand?: BackendBrand;
    }
  }
}

const VALID: readonly string[] = ["airkrit", "edulyt"];

/**
 * The brand is an allow-listed enum, never a URL. It selects a server-side
 * configured domain — it can never become one. A hostile header value is
 * discarded, and the caller falls back to FRONTEND_URL.
 */
export function brandFromRequest(req: Request): BackendBrand | undefined {
  const raw = req.headers["x-brand"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return undefined;
  const normalised = value.toLowerCase();
  return VALID.includes(normalised) ? (normalised as BackendBrand) : undefined;
}

export function attachBrand(req: Request, _res: Response, next: NextFunction) {
  req.brand = brandFromRequest(req);
  next();
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd backend && npx vitest run src/middleware/__tests__/brand.middleware.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: Mount the middleware**

In `backend/src/app.ts`, after the CORS setup near line 59:

```typescript
import { attachBrand } from "./middleware/brand.middleware";
// ...
app.use(attachBrand);
```

`cors` is configured with `origin: true`, which reflects any origin, so no CORS change is needed for the new domain. But `x-brand` must be an **allowed request header**. If the cors options specify `allowedHeaders`, add `"X-Brand"`. If they do not, the default reflects the request's `Access-Control-Request-Headers` and no change is needed — verify which by reading the options object.

- [ ] **Step 6: Send the header from the frontend**

In `frontend/src/configs/apiConfig.ts`, add the import:

```typescript
import { BRAND } from "@/config/brand";
```

Then in the axios instance's static headers:

```typescript
  headers: {
    "Content-Type": "application/json",
    "X-Brand": BRAND.id,
  },
```

For the combined build this sends `"combined"`, which `brandFromRequest` rejects, so the backend falls back to `FRONTEND_URL` — exactly today's behaviour.

- [ ] **Step 7: Use it for the password reset email**

In `backend/src/controllers/auth.controller.ts`, replace lines 524–531:

```typescript
    const frontendUrl = resolveFrontendUrl(req.brand);
```

and the link:

```typescript
        link: `${frontendUrl}/reset-password?token=${resetPasswordToken}`,
```

Delete the `if (!process.env.FRONTEND_URL) throw new AppError(...)` guard — `resolveFrontendUrl` always returns a usable value.

Apply the same treatment to the email-verification link in this controller.

> **⚠ Pre-existing bug, deliberately not fixed here.** `/reset-password` **does not exist in the frontend** — there is no such route under `src/app/`, and `forgot-password` does not handle a token. Every password-reset email currently links to a 404. This is unrelated to the split and predates it. Making the link brand-aware does not fix it. Raise it separately and decide whether to build the route before or after the split; do not expand this task's scope to cover it.

- [ ] **Step 8: Verify end to end**

Run: `cd backend && npm test && npm run build`

Then with both apps running, trigger a password reset from the frontend and confirm the backend log or the sent email shows the host matching the brand that made the request.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/configs/apiConfig.ts backend/src/middleware backend/src/app.ts backend/src/controllers/auth.controller.ts
git commit -m "feat(brand): propagate request brand via X-Brand header"
```

---

# Phase 2 — Environment and deployment

---

### Task 11: Per-brand env files and dev ergonomics

**Files:**
- Create: `frontend/.env.airkrit`
- Create: `frontend/.env.edulyt`
- Modify: `frontend/package.json`
- Modify: `frontend/src/configs/authOption.ts`
- Modify: `backend/.env` (document the new vars; do not commit secrets)

**Interfaces:**
- Consumes: `BRAND` from `@/config/brand`
- Produces: nothing new.

- [ ] **Step 1: Create the two env files**

Model them on the existing `.env.main`. Same keys, brand-specific values:

`frontend/.env.airkrit`:

```
NEXT_PUBLIC_BRAND=airkrit
NEXT_PUBLIC_APP_URL=https://www.airkrit.com
NEXTAUTH_URL=https://www.airkrit.com
```

`frontend/.env.edulyt`:

```
NEXT_PUBLIC_BRAND=edulyt
NEXT_PUBLIC_APP_URL=https://www.edulyt.com
NEXTAUTH_URL=https://www.edulyt.com
```

Copy every remaining key from `.env.main` into both — API base URL, `NEXTAUTH_SECRET`, OAuth client IDs, payment vars, feature flags. Both files carry real secrets, so confirm `.env.*` is gitignored before writing them:

```bash
cd frontend && git check-ignore -v .env.airkrit
```

Expected: a matching gitignore rule. If it prints nothing, **stop** and add `.env.*` to `.gitignore` first.

- [ ] **Step 2: Add per-brand scripts**

In `frontend/package.json`:

```json
    "dev:airkrit": "next dev --port 3000",
    "dev:edulyt": "next dev --port 3001",
    "build:airkrit": "next build",
    "build:edulyt": "next build"
```

Each is run with the matching env file supplied by the deploy pipeline or a local `cp .env.airkrit .env` step. Document the chosen mechanism in `frontend/README.md` — do not invent a new one if the deploy pipeline already has a convention for `.env.main` / `.env.whitelist`. Check how those are consumed today first.

- [ ] **Step 3: Scope the auth cookies per brand**

Cookies ignore port, so two local dev servers on 3000 and 3001 share `localhost` cookies and will clobber each other's session. In production the domains differ and cannot collide, but distinct names are still correct.

In `frontend/src/configs/authOption.ts`, add:

```typescript
import { BRAND } from "@/config/brand";

const useSecureCookies = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const cookieBase = `${cookiePrefix}${BRAND.id}.next-auth`;
```

and inside the exported options object:

```typescript
  cookies: {
    sessionToken: {
      name: `${cookieBase}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookieBase}.callback-url`,
      options: { sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    csrfToken: {
      // The CSRF cookie must NOT carry the __Secure- prefix; NextAuth uses
      // __Host- semantics for it. Renaming only the base avoids a mismatch.
      name: `${BRAND.id}.next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
```

- [ ] **Step 4: Verify sessions survive the rename**

**This logs out every currently signed-in user on whichever domain ships it**, because the cookie name changes. Confirm that is acceptable for the airkrit build before shipping, or defer this step to the Phase 3 cutover window when a re-login is already expected.

Test locally: sign in, confirm the cookie name in devtools matches `airkrit.next-auth.session-token`, reload, confirm the session persists, sign out, confirm it clears.

- [ ] **Step 5: Document the backend vars**

Add to the backend env documentation (and the deployed environment):

```
AIRKRIT_URL=https://www.airkrit.com
EDULYT_URL=https://www.airkrit.com   # points at airkrit until Phase 3 cutover
FRONTEND_URL=https://www.airkrit.com # fallback — do not remove
```

`EDULYT_URL` deliberately points at airkrit.com until Phase 3, so Phase 1 changes nothing observable.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/src/configs/authOption.ts frontend/README.md
git commit -m "chore(brand): per-brand env files, dev scripts and cookie scoping"
```

---

# Phase 3 — Cutover

Do not start until Phase 2 is deployed and edulyt.com has been soaked in parallel with airkrit.com still serving internships.

---

### Task 12: External configuration

**Files:** none — this is infrastructure work, but it blocks the cutover.

- [ ] **Step 1: DNS and TLS for edulyt.com**, pointing at the edulyt build.

- [ ] **Step 2: Google OAuth** — add `https://www.edulyt.com` as an authorised JavaScript origin and `https://www.edulyt.com/api/auth/callback/google` as a redirect URI. Verify domain ownership for the consent screen.

- [ ] **Step 3: LinkedIn OAuth** — add the equivalent origin and `https://www.edulyt.com/api/auth/callback/linkedin`.

- [ ] **Step 4: Paytm** — whitelist the edulyt.com return/callback URL for internship orders. Coordinate with the Razorpay Phase 2 work: the frontend is still Paytm-only across its launchers, so confirm the internship checkout completes end to end on edulyt.com **before** any traffic moves.

- [ ] **Step 5: Register edulyt.com in Search Console.** Do not use Change of Address — this is a partial move, so the 301s in Task 13 are the only signal.

- [ ] **Step 6: Verify each** with a real transaction in a staging or low-traffic window. Sign in with Google on edulyt.com, sign in with LinkedIn, and complete one internship purchase. All three must pass before Task 13.

---

### Task 13: Redirects and cutover

**Files:**
- Modify: `frontend/next.config.ts`
- Modify: `frontend/src/app/(auth)/login/page.tsx`
- Modify: backend environment (`EDULYT_URL`)

- [ ] **Step 1: Add brand-conditional redirects**

In `frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const BRAND = process.env.NEXT_PUBLIC_BRAND;
const EDULYT_ORIGIN = "https://www.edulyt.com";

// Internships moved to edulyt.com. Courses and community never moved, so they
// need no redirects. Never redirect /verify-certificate or /verify/intern —
// certificates already in circulation point at airkrit.com (Migration.md §7.1).
const airkritRedirects = [
  { source: "/internships", destination: `${EDULYT_ORIGIN}/internships`, permanent: true },
  { source: "/internships/:path*", destination: `${EDULYT_ORIGIN}/internships/:path*`, permanent: true },
  { source: "/dashboard/internships/:path*", destination: `${EDULYT_ORIGIN}/dashboard/internships/:path*`, permanent: true },
  { source: "/dashboard/applications", destination: `${EDULYT_ORIGIN}/dashboard/applications`, permanent: true },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard/profile", destination: "/profile", permanent: false },
      { source: "/dashboard/settings", destination: "/settings", permanent: false },
      // Courses → Programs route migration. Keeps old URLs/bookmarks working
      // and catches any internal link still pointing at /courses.
      { source: "/courses", destination: "/programs", permanent: true },
      { source: "/courses/:path*", destination: "/programs/:path*", permanent: true },
      ...(BRAND === "airkrit" ? airkritRedirects : []),
    ];
  },
  images: {
    qualities: [100],
    remotePatterns: [{ protocol: "https", hostname: "*" }],
  },
};

export default nextConfig;
```

The redirects must be declared **before** the middleware gate can 404 them — Next runs `redirects()` first, so `/internships` on the airkrit build redirects rather than 404s. Verify this ordering in Step 4; if the 404 wins, move the redirect logic into `proxy.ts` ahead of the `ownsRoute` check.

- [ ] **Step 2: Add the re-login message to the edulyt login page**

Sessions are per-domain, so students arriving from an airkrit redirect land logged out. In `frontend/src/app/(auth)/login/page.tsx`, render above the form:

```tsx
{BRAND.id === "edulyt" && (
  <p className="mb-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-900">
    Edulyt is now the home of internships. Sign in with your existing account —
    same email and password.
  </p>
)}
```

Import `BRAND` from `@/config/brand`.

- [ ] **Step 3: Point `EDULYT_URL` at the real domain**

In the backend environment, change `EDULYT_URL` from the airkrit host to `https://www.edulyt.com` and restart. From this moment new internship certificates verify on edulyt.com.

- [ ] **Step 4: Deploy and verify the redirects**

```bash
curl -sI https://www.airkrit.com/internships | head -5
curl -sI https://www.airkrit.com/internships/some-slug | head -5
curl -s -o /dev/null -w "%{http_code}\n" https://www.airkrit.com/verify-certificate/X
curl -s -o /dev/null -w "%{http_code}\n" https://www.airkrit.com/programs
```

Expected: `301` to the edulyt host for the first two, **`200`** for the certificate verification route, `200` for `/programs`.

- [ ] **Step 5: Send the intern email campaign**

Notify active interns that internships have moved to edulyt.com and they will need to sign in there once. Send this **after** Step 4 verifies, not before.

- [ ] **Step 6: Monitor**

For 48 hours watch: 404 rate on both domains, login success rate on edulyt.com, checkout completion for internship orders, and certificate verification requests on airkrit.com. A spike in airkrit 404s means a route prefix is missing from the redirect list.

- [ ] **Step 7: Commit**

```bash
git add frontend/next.config.ts "frontend/src/app/(auth)/login/page.tsx"
git commit -m "feat(brand): redirect internship routes to edulyt and add re-login notice"
```

---

# Phase 4 — Cleanup

---

### Task 14: Strip cross-brand copy

**Files:**
- Modify: `frontend/src/app/(pages)/(home)/components/sections/*` (airkrit)
- Modify: `frontend/src/app/(pages)/(other-pages)/about/page.tsx`
- Modify: `frontend/src/app/(pages)/cart/CartForm.tsx:562`
- Modify: `frontend/src/components/shared/Footer/Footer.tsx` (tagline, line ~170)
- Modify: `frontend/src/app/(pages)/community/guidelines/page.tsx`

- [ ] **Step 1: Find every cross-brand mention**

```bash
cd frontend && npx grep -rln "internship" --include="*.tsx" src/app/\(pages\)/\(home\) src/app/\(pages\)/\(other-pages\) src/components/shared/Footer
```

- [ ] **Step 2: Rewrite each to reference only the owning brand's offering**, or to link to the sibling domain via `BRAND.siblingDomain` where cross-selling is wanted. Example, `CartForm.tsx:562`:

```
student account to purchase courses.
```

- [ ] **Step 3: Make the legal pages brand-specific** — `about`, `privacy-policy`, `terms-of-use`, `security-policy`, `cancellation-refund-policy` must name the correct legal entity and support email. Use `BRAND.legalEntity` and `BRAND.supportEmail` rather than hardcoding.

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run test && npx tsc --noEmit && npm run build`

Then build each brand and read the home page, footer and about page for wrong-brand references.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "chore(brand): remove cross-brand copy from marketing and legal pages"
```

---

## Spec coverage

| Spec section | Task |
| --- | --- |
| §3.1 `brand.ts` | Task 1 |
| §3.2 `routeOwnership.ts` | Task 2 |
| §3.3 middleware gate | Task 5 |
| §4 route ownership table | Task 2 |
| §4 root route `/`, canonical | Task 6 |
| §4 `/admin/settings` split | Tasks 2, 4 |
| §5 navbar, footer | Task 3 |
| §5 admin sidebar | Task 4 |
| §5 metadata, sitemap, robots | Task 6 |
| §5 `authOption.ts` cookies | Task 11 |
| §5 `apiConfig.ts` X-Brand | Task 10 |
| §6 `resolveFrontendUrl` | Task 7 |
| §6 certificate call sites | Task 8 |
| §6 live-class, payment, cron | Task 9 |
| §6 auth emails | Task 10 |
| §7.1 certificate QR constraint | Tasks 2, 5, 8, 13 |
| §7.2 redirects | Task 13 |
| §7.3 session loss messaging | Task 13 |
| §7.4 OAuth, Paytm, DNS, Search Console | Task 12 |
| §8 phased rollout | Phase structure |
| §9 leakage guard test | Task 3 |

**Not covered by a task, by design:** §5's per-brand filtering of announcements, admin orders, partner portal and success-points copy. Those are mechanical filters that depend on backend fields not yet confirmed to exist. Scope them once §10 open item 4 is resolved — each is a small follow-up, not a blocker for the domain split.

**Spec open items still unresolved** (from Migration.md §10) — resolve before Task 2 is finalised, since two of them change the ownership map:
1. `admin/settings/platform-pricing` is an empty directory — delete or implement.
2. Confirm `/live-class` is course-only and `/live-meeting` internship-only. The recent course-live-classes rebuild reused the internship live-meeting model; if the routes share a tree, Task 2's map and Task 9's brand assignment are both wrong.
3. Cross-link between dashboards — deferred.
4. Whether `colleges` master data is written from both admins.

**Additional finding, outside this plan's scope:** `/reset-password` has no frontend route, so password-reset emails currently 404. See Task 10 Step 7.
