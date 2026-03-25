# Roadmap: SVG Spawn

> Date: 2026-03-24

---

## Code Review Remediation (2026-03-24)

> Source: Expert code review, verified against source code

### Critical

- [ ] **`linear-mode.tsx:42`** — Polls non-existent API endpoint (`/api/projects/${id}/jobs/${jobId}` vs actual `/api/jobs/${jobId}`). Always falls through to mock. Fix: change URL to `/api/jobs/${jobId}`.
- [ ] **`animated-preview.tsx:53`** — XSS via `dangerouslySetInnerHTML` with unsanitized SVG from mock fallback path. Fix: always re-sanitize SVG before rendering, or use sandboxed iframe.

### High

- [ ] **All API routes** — No authorization check: any authenticated user can access any project/node/job by guessing UUID. Fix: verify `project.workspaceId` belongs to requesting user.
- [ ] **`upload-store.ts:29`** — `URL.createObjectURL` never revoked; memory leak on repeated uploads. Fix: call `URL.revokeObjectURL` on previous URL in `setFile` and `reset()`.
- [ ] **`nodes/route.ts:63`** — Race condition in credit check vs consumption. Credits checked at request time, decremented later in job worker. Fix: decrement atomically at request time and refund on failure.

### Medium

- [ ] **`linear-mode.tsx:109`** — Sends `{ prompt, svgString }` payload but endpoint expects `{ prompt, parentNodeId }`. Fix: create project first, then use returned ID.
- [ ] **`poller.ts:33`** — Catch block in polling loop is empty; silently swallows all errors. Fix: add error counting and callback after N consecutive failures.
- [ ] **`sanitize.ts`** — `<style>` element CSS not sanitized for `@import` or `url()` external references. Fix: strip external references from style text content.
- [ ] **`upload/route.ts`** — No server-side file size limit. Frontend enforces 5MB but API does not. Fix: reject `rawSvg.length > 5MB`.
