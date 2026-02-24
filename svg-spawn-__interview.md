# SVG Spawn — Interview Log

---

## Turn 1: Foundation — Users, Platform, Business Model

### Questions Asked

**Q1: Who is the primary target user?**
Options: Designers first, Developers first, Both equally

**Q2: Platform — desktop or web?**
Options: Web app, Desktop (Tauri), Desktop (Electron), Web app desktop later

**Q3: Business model?**
Options: Open source, SaaS product, Personal/portfolio

### Responses

- **Target user:** "Let's create a spec for each" — both designers and developers are primary personas. The spec will address both with progressive disclosure UX.
- **Platform:** Web app
- **Business model:** SaaS product

---

## Turn 2: Node Architecture

### Questions Asked

**Q1: What does a 'node' represent?**
Options: Generation step, Granular pipeline, Generation + modifiers

**Q2: How does morph fit into the node graph?**
Options: Special morph node, Same node morph mode

**Q3: How does chaining work?**
Options: Sequential refinement, Additive composition, Sequential by default

### Responses

- **Node model:** Generation + modifiers. Core nodes = AI generation steps outputting structured animation plan + compiled SVG. Modifier nodes operate deterministically on the plan (retiming, easing, intensity scaling, loop behavior, selective overrides) without regeneration.
- **Morph:** Special morph node with two explicit SVG input ports. Morphing has fundamentally different validation, matching, and failure modes — it should be a first-class node type. Shares pipeline internally but visually/structurally distinct.
- **Chaining:** Sequential by default. AI produces consolidated plan resolving intent. Additive layering as explicit mode with plan-level merging, strict rules (separate channels per property, transform composition policy, conflict warnings).

---

## Turn 3: Animation Plan IR & AI Input

### Questions Asked

**Q1: What level of detail for the animation plan IR?**
Options: Element-level descriptors, Timeline with groups, Both — layered IR

**Q2: What does the AI receive as input?**
Options: Raw SVG only, Structured summary + SVG, Structured summary + SVG with truncation

### Responses

- **Animation plan IR:** Both — layered IR. Two-layer plan: high-level timeline/group model (groups with start, duration, easingPreset, targets, semantic effectType) compiled down to normalized element-level channels (channels[elementId][property] → keyframes[]). Modifiers operate on channels; UI and AI operate on groups. Round-trip by updating groups and recompiling.
- **AI input:** Structured summary + SVG with truncation. Always parse/normalize first. Send: (a) structured summary (viewBox, element inventory with stable IDs, groups/layers, bounding boxes, colors, transforms, flags), and (b) raw SVG when it fits. For large SVGs: full summary + simplified/truncated SVG preserving structure. Model returns edits against canonical parsed representation, not re-parsed markup.

---

## Turn 4: Preview UX, Designer Experience, Export

### Questions Asked

**Q1: Preview experience on nodes?**
Options: Live inline, Dedicated panel, Thumbnail + panel, Inline with play control

**Q2: Do designers need the node graph for simple use cases?**
Options: Node graph only, Linear mode + graph, Linear mode as onboarding

**Q3: Export formats?**
Options: SVG only, SVG + snippets, Multi-format, SVG + Lottie + snippets

### Responses

- **Preview UX:** Inline with play control. Static thumbnails by default, lightweight play toggle for spot-checking, dedicated larger preview panel for selected node with scrubber, loop controls, comparison tools (original vs animated, diff/overlay, before/after for morph).
- **Designer UX:** Linear mode as onboarding. Default to simple linear flow, behind the scenes still a graph. After first success, progressively introduce branching ("Try a variation"), then reveal full node graph. Both modes always accessible.
- **Export:** SVG + Lottie + snippets. SVG is native source of truth. Lottie JSON as first-class export for mobile/marketing pipelines. Code snippets (HTML embed, inline SVG, React component, optional JS fallback). Skip GIF/MP4. Animation Plan IR compiles to all formats deterministically.

---

## Turn 5: Tech Stack, Backend, Storage

### Questions Asked

**Q1: Frontend stack?**
Options: React + React Flow, Svelte + Svelvet, Vue + VueFlow

**Q2: Backend / API layer?**
Options: Node.js (Express/Fastify), Node.js + serverless, Python (FastAPI), Next.js full-stack

**Q3: Storage?**
Options: PostgreSQL + S3, Supabase, Firebase/Firestore

### Responses

- **Frontend:** React + React Flow (xyflow). Also: Next.js App Router, TypeScript, Zustand for state, Tailwind + Radix/shadcn, native SVG rendering with sandboxing, animation scrubbing on IR.
- **Backend:** Detailed two-phase architecture:
  - **MVP:** AWS serverless — S3+CloudFront hosting, API Gateway + Lambda (Node/TS), SQS queue + Lambda workers, RDS Postgres (t4g, single-AZ), DynamoDB for rate limits, Cognito/Clerk auth, Stripe billing, CloudWatch. Client: submit job → poll → fetch from S3.
  - **Scale-up:** Aurora Serverless v2, DynamoDB job-state store, split queues by workload class, dead-letter queue, aggressive caching (canonicalized SVG+prompt+settings), WebSocket push updates, WAF, tracing, S3 Intelligent-Tiering, tier-based priority queues.
- **Storage:** PostgreSQL + S3

---

## Turn 6: Security, Billing, Error Handling

### Questions Asked

**Q1: SVG sanitization strategy?**
Options: Aggressive sanitize, Moderate sanitize, Sanitize + allowlist

**Q2: Pricing model?**
Options: Credit-based, Subscription tiers, Hybrid, Usage-based only

**Q3: Error handling for failed/poor AI results?**
Options: Retry + feedback loop, Validation gate, Both

### Responses

- **Security:** Sanitize + allowlist. Broad allowlist for rendering features (defs, gradients, filters, masks, etc.), strict on execution/networking. XML parser disables DTDs/external entities. Remove all scripting surfaces. Reject external references. Disallow dangerous protocols. Store original in S3 unsanitized but never serve it. Sandboxed iframe with tight CSP.
- **Billing:** Hybrid. Subscription tiers with monthly compute credit allowance. Cost scales by SVG complexity + generation type. Modifiers unlimited. Overage at clear per-credit rate. Tiers: Free (limited, watermark), Pro (generous, commercial, priority), Team (pooled, shared, higher concurrency). Optional bulk credit packs.
- **Error handling:** Both. Structural failures: never show broken results, auto-retry with error feedback in prompt, no credit cost for retries or final failure state. Creative mismatches: show result immediately, regenerate button (costs credits), "Refine this result" input with structured feedback, optional quick-fix controls.

---

## Turn 7: Morph Matching, Complexity, Collaboration

### Questions Asked

**Q1: How does morph handle element correspondence between two different SVGs?**
Options: AI auto-match, Require same structure, AI match + manual override

**Q2: SVG complexity limits?**
Options: Element count gate, Computed complexity score, Token-budget gate, Tiered with auto-simplify

**Q3: Team tier collaboration model?**
Options: Async sharing only, Real-time collaboration, Async + comments

### Responses

- **Morph matching:** AI match + manual override. Normalize both SVGs → automatic matching in stages (IDs → structural similarity → geometric similarity → visual similarity) → correspondence map with confidence scores. High confidence = auto-generate. Low confidence = manual mapping UI (side-by-side, drag-to-map, click-pair, fade-in/out marking). Store correspondenceMap in IR. Morph compiler: normalize path commands, interpolate d attributes, crossfade fallback.
- **Complexity:** Tiered with auto-simplify, backed by internal computed complexity score (element count, path count/complexity, nesting depth, filter/mask usage, gradients, text, estimated tokens). Map to plan tiers. Exceed = message + actions (auto-simplify, upgrade, tips). Simplification preserves t=0 fidelity, stores original. **MVP: hard limit only.**
- **Collaboration:** Async + comments. Shareable links, forking with lineage, roles (Owner/Editor/Viewer), node-level comments, resolve threads, mentions, snapshot comparison. No CRDT. Real-time presence deferred.

---

## Turn 8: AI Output, Product Name, Pre-Animated SVGs

### Questions Asked

**Q1: Should Gemini output structured JSON (plan IR) or annotated SVG markup?**
Options: Structured JSON, Annotated SVG markup, JSON plan + SVG preview

**Q2: Product name?**
Options: SVG Spawn, Working title only, Different name

**Q3: Pre-animated SVG handling?**
Options: Strip and warn, Preserve + layer, User choice

### Responses

- **AI output:** JSON plan + SVG preview. JSON plan IR is source of truth — Gemini returns schema-conforming plan, backend validates/normalizes/compiles deterministically. SVG preview is non-authoritative — used for sanity checks, debugging, diffing intent vs compiler output.
- **Product name:** Working title only ("SVG Spawn")
- **Pre-animated SVGs:** User choice. Detect existing animations, present: "Start fresh" (default, strip animations, preserve t=0) or "Keep and extend" (import as locked baseline layer, add new with conflict warnings).

---

## Turn 9: Element Targeting, Determinism, Diffs

### Questions Asked

**Q1: Element targeting UX?**
Options: Click-to-select in preview, Layer panel selection, Both + prompt fallback, Prompt-only

**Q2: Determinism and reproducibility?**
Options: Best-effort with seeds, Immutable snapshots, Strict reproducibility

**Q3: Versioning and diff UX?**
Options: Visual side-by-side, Visual + plan diff, Visual + overlay

### Responses

- **Targeting:** Both + prompt fallback. Click-to-select in preview + layer/tree panel + prompt-only fallback. Critical detail: targets bind to stable `nodeUid` with fingerprints (element type, ancestry, bbox, centroid, area, path length, style). Remapping after simplification by fingerprint similarity; low-confidence = "targets need review." Named target sets for reuse.
- **Determinism:** Immutable snapshots. Every generation = permanent artifact bundle (input, plan, compiled SVG, metadata with model/compiler/schema versions). "Generate a variation" vs "try to stay close" as UX. Store seed if available but no hard guarantee. Historical outputs retained alongside plans.
- **Diffs:** Visual + plan diff, with overlay as toggle inside visual compare. Side-by-side with synced playback, quick toggles (first frame, peak pose, export size). Structured plan diff: targets, effects, timing, property channels, compiler warnings. Overlay/ghosting as simple toggle.

---

## Turn 10: Fonts, Browser Support, Guardrails

### Questions Asked

**Q1: Text and font handling?**
Options: Auto-convert to paths, Preserve text convert on demand, Font embedding

**Q2: Browser support policy?**
Options: Evergreen only, Evergreen + iOS Safari, Maximum compatibility

**Q3: Animation guardrails?**
Options: Soft defaults, Hard limits + overrides, Quality score gate

### Responses

- **Fonts:** Preserve text, convert on demand. Keep `<text>` for editability. Detect text on import, surface font status. Explicit "Convert to outlines" action (non-destructive, store both). Morph requires outlines or falls back to crossfade. Font embedding reserved for future enterprise.
- **Browser support:** Evergreen + iOS Safari. Latest 2 versions of Chrome/Edge/Firefox/Safari + current iOS Safari/WebKit. "Browser target" as compiler setting. Compiler applies iOS-specific workarounds. Fallback strategies + warnings for unsupported features. Export metadata includes compatibility report.
- **Guardrails:** Soft defaults with warnings and tier-based override controls. Defaults: ~8-12s duration cap, looping off, ~50 animated element cap, avoid expensive properties, always emit prefers-reduced-motion. Don't hard-block — surface warnings with one-click mitigations. Higher limits as paid feature later.

---

## Turn 11: Lottie, Job UX, Telemetry

### Questions Asked

**Q1: Lottie export — handling unsupported features?**
Options: Export what's possible warn, Lottie-safe mode, Both modes

**Q2: Job system UX during generation wait?**
Options: Spinner + progress, Optimistic preview, Background generation

**Q3: Telemetry and quality feedback loop?**
Options: Minimal + opt-in, Anonymized analytics, Full with consent

### Responses

- **Lottie:** Both modes. Default creation uses full SVG power. Lottie export offers: (a) best-effort with degradation report, (b) Lottie-safe mode constraint. Store export constraints in plan for branching (web SVG branch vs Lottie branch).
- **Job UX:** Background generation (combination of all options). Async non-blocking jobs. Show static SVG immediately, progress indicators, stage labels, cancel button. Estimated time for long jobs. Smooth transition on completion, notification badges. Priority by billing tier. Key principle: UI never feels blocked.
- **Telemetry:** Full with consent. Log prompts, SVG metadata, validation failures, regenerate frequency, time-to-export, manual overrides, degradation events. Privacy: raw SVGs never for training, explicit ToS disclosure, opt-out available, Enterprise can disable prompt logging, no cross-user exposure, 90-day retention, separate analytics storage. Trust is competitive advantage.

---

## Turn 12: Data Model & Permissions

### Questions Asked

**Q1: Data model — Project > Graph > Nodes, or additional entities?**
Options: Project > Graph > Nodes, Workspace > Projects, Workspace > Projects + Templates

**Q2: Permission granularity for Team tier?**
Options: Simple roles, Project-level roles, Simple roles + external sharing

### Responses

- **Data model:** Workspace > Projects. Workspace = billing/account/membership/sharing boundary. Keep templates out of MVP (can be special Projects later). Additional entities: Artifact (separate table with content hashes for dedup/caching), Job/Run (track each generation attempt separately; node points to "winning" run).
- **Permissions:** Simple roles + external sharing. Workspace-level roles (Owner/Editor/Viewer). Project-level external sharing: link-based (view-only, comment-only, fork-only), optional password + expiry, audit log for Team/Enterprise. Implemented as access policy / share token.

---

## Summary of Significant Deviations from Original Description

### 1. Node architecture expanded from simple to layered
**Original:** "Iterate through nodes, branch different animation ideas"
**Final:** Generation nodes + modifier nodes + morph nodes, with a two-layer animation plan IR (groups + channels). Modifiers are deterministic (no AI call). This was an expansion, not a contradiction — the original concept was validated but deepened.

### 2. Progressive disclosure UX added
**Original:** Implied a node-graph-first experience
**Final:** Linear mode as default onboarding for designers, with progressive introduction of the node graph. Both modes always accessible. This addresses the dual-persona requirement without compromising on power.

### 3. MVP scope deliberately narrowed
**Original:** Described full feature set (morph, branching, chaining)
**Final:** MVP includes only linear mode + basic node graph (branching), generation nodes only, SVG export only. Morph, modifiers, Lottie, collaboration, and auto-simplification are explicitly post-MVP. Rationale: validate core AI generation quality before layering complexity.

### 4. Morph matching elevated to complex subsystem
**Original:** "Upload before and after SVG and it generates the transition"
**Final:** Multi-stage element correspondence system (AI auto-match + manual override UI) with normalization, fingerprinting, confidence scoring, and fallback crossfade. This reflects the real technical complexity of the morph problem.

### 5. Infrastructure designed for two phases
**Original:** No infrastructure specifics
**Final:** Lean AWS serverless MVP (near-zero idle cost) with a detailed scale-up path (Aurora, split queues, caching, WebSocket, WAF). Both phases documented to prevent rearchitecture.

### 6. Animation Plan IR became central architecture
**Original:** Not mentioned
**Final:** The two-layer animation plan IR (groups + channels) is the canonical source of truth for all compilation, modification, export, and versioning. This emerged as the single most important architectural decision — it's what makes modifiers, Lottie export, additive layering, and deterministic compilation possible.
