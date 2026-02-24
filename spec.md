# SVG Spawn — Product Specification

> **Working title.** Name subject to change before launch.

> **MVP Status (Feb 2026):** All 7 implementation phases complete. 277 unit tests + 22 E2E tests passing. See `README.md` for setup and architecture details.

---

## 1. Vision & Value Proposition

SVG Spawn is an AI-powered web application that transforms static SVGs into production-ready animated SVGs. Users upload an SVG, describe the desired animation in plain text, and the system generates animated output using SMIL and CSS animations — preserving the original aesthetics.

The tool uses a **node-based workflow** for creative exploration: users branch different animation ideas in parallel, chain results for iterative refinement, and compare outputs visually until the result is perfect. A morph animation mode generates transitions between a "before" and "after" SVG.

**Core value proposition:** Turn any SVG into a polished animation in minutes, not hours — with AI that understands motion design intent and a workflow built for creative iteration.

---

## 2. Target Users

### Designers (Primary persona)
Motion designers, illustrators, and UI designers who work in Figma/Illustrator and want to animate their SVG exports without writing code. They value visual feedback, approachability, and speed.

### Developers (Primary persona)
Frontend developers and SVG power users who want fast iteration on animated SVGs. They're comfortable with node graphs and want precise control, clean code output, and integration-ready exports.

Both personas are first-class. The product uses **progressive disclosure** — designers start in a simple linear mode and graduate to the full node graph; developers can jump straight into the graph.

---

## 3. Platform & Business Model

| Attribute | Decision |
|---|---|
| **Platform** | Web application (SaaS) |
| **Framework** | Next.js (App Router) |
| **Business model** | Hybrid subscription + usage-based |
| **AI backend** | Google Gemini 3.1 Pro |

---

## 4. Node Architecture

### 4.1 Node Types

#### Generation Node
- Represents one AI generation call
- **Inputs:** SVG (file or upstream node output) + text prompt + optional target selection
- **Outputs:** Immutable artifact bundle (animation plan JSON + compiled animated SVG + metadata)
- Branching = trying different prompts on the same input
- Chaining = feeding one node's output as the next node's input

#### Morph Node (post-MVP)
- First-class distinct node type with **two SVG input ports** (before + after) + prompt
- Shares the animation plan and compilation pipeline internally
- Visually distinct in the graph for clarity
- Requires element correspondence mapping (see Section 10)

#### Modifier Nodes (post-MVP)
- Deterministic, no AI call — operate on the animation plan IR
- Types: retiming, easing, intensity scaling, loop behavior, selective property overrides
- Operate on the channel layer of the IR (see Section 5)
- Unlimited usage (no credit cost)

### 4.2 Chaining Behavior

**Default: Sequential refinement.** The next generation node ingests the prior result (including its animation plan) and produces a new consolidated plan and compiled SVG. The AI resolves intent ("keep the bounce, add a color pulse") while maintaining a single coherent timeline.

**Explicit additive layering** (post-MVP): An explicit mode/setting (not just prompt text) that preserves existing animations and adds a new layer. Implemented by merging at the plan level with strict rules:
- Separate channels per property
- Transform composition policy
- Conflict warnings surfaced to user

### 4.3 Node States

Each node has an explicit lifecycle state:
- **Pending** — queued for generation
- **Generating** — AI call in progress (with stage indicator)
- **Compiling** — animation plan being compiled to SVG
- **Completed** — artifact bundle ready
- **Failed** — generation failed after retries (with retry action)
- **Canceled** — user canceled the job

---

## 5. Animation Plan IR (Intermediate Representation)

A **two-layer** structured representation that is the canonical source of truth for all compilation, modification, and export.

### 5.1 High-Level Layer: Groups

Captures intent and structure for human readability and AI reasoning.

```
groups[]: {
  id: string
  name: string                    // e.g., "logo-bounce", "background-pulse"
  effectType: string              // semantic: bounce, pulse, reveal, draw-on, fade, slide, etc.
  targets: TargetRef[]            // references to nodeUids or named target sets
  start: number                   // ms offset on timeline
  duration: number                // ms
  easingPreset: string            // e.g., "ease-in-out", "spring", "elastic"
  repeatCount: number | "indefinite"
  sequence?: string               // reference to parent sequence/scene
}
```

### 5.2 Low-Level Layer: Channels

Normalized element-level descriptors — the canonical form for deterministic modifiers, merging, validation, and compilation.

```
channels[elementNodeUid][property]: {
  keyframes[]: {
    offset: number                // 0–1 normalized time
    value: string | number
    easing: string                // per-segment easing
  }
  duration: number
  delay: number
  repeatCount: number | "indefinite"
  fill: "forwards" | "backwards" | "both" | "none"
  compilationBackend: "smil" | "css"   // chosen by compiler
}
```

### 5.3 Compilation Flow

```
Groups (AI + UI operate here)
    ↓ compile
Channels (modifiers operate here)
    ↓ compile
SMIL/CSS output (embedded in SVG)
    ↓ compile (post-MVP)
Lottie JSON
```

Regeneration/patching can round-trip by updating groups and recompiling channels.

---

## 6. AI Integration

### 6.1 Input Pipeline

1. **Parse and normalize** the uploaded SVG server-side
2. **Extract structured summary** optimized for AI targeting:
   - viewBox, dimensions
   - Element inventory with stable internal `nodeUid`s
   - Groups/layers hierarchy
   - Bounding boxes, centroids
   - Dominant colors, transform chains
   - Text/filter/mask/gradient/pattern flags
   - `<defs>` usage
3. **Send to Gemini:**
   - Full structured summary (always)
   - Raw SVG when it fits within token budget
   - For large/complex SVGs: simplified/truncated SVG that preserves structure and representative geometry (keep IDs, group hierarchy, key paths; collapse repeated/near-identical paths; replace heavy `d` attributes with placeholders + per-element bbox/length metrics)

### 6.2 Output Format

Gemini returns:
1. **Structured animation plan JSON** conforming to the plan IR schema (source of truth)
2. **Compiled SVG preview** (non-authoritative — used for sanity checks, debugging, and prompt improvement via diff against the backend's own compilation)

The backend validates the JSON plan, compiles it through its own deterministic compiler, and serves the canonical output.

### 6.3 Prompt Strategy

- Use Gemini's structured output / function calling for schema enforcement
- System prompt includes the plan IR schema, SVG summary format, and animation vocabulary
- User prompt is the natural language animation description
- For chaining: include the prior node's animation plan as context
- For refinement: append structured user feedback to the prompt

---

## 7. SVG Processing Pipeline

### 7.1 Import & Sanitization

**Allowlist-based sanitization** with broad rendering support and strict execution/networking controls:

- Parse with XML parser configured to **disable DTDs/external entities** (prevent XXE)
- **Allowlist** permitted SVG elements and attributes (broad for rendering: `defs`, `gradients`, `filters`, `mask`, `clipPath`, `pattern`, `symbol`, `use`, `text`, `g`, shapes, paths, etc.)
- **Remove** all execution surfaces: `<script>`, event handler attributes, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, unknown namespaces
- **Reject/rewrite** external references: `href`, `xlink:href`, `url(...)`, `@import`, `font-face src` → internal IDs only
- **Disallow** dangerous protocols: `javascript:`, `data:` (except tightly-scoped image MIME types)
- Store original as-is in S3 (never served unsanitized)
- Serve sanitized SVG only, in sandboxed iframe with tight CSP (no scripts, no network, no top-nav)

### 7.2 Normalization

- Assign persistent internal `nodeUid` to every element
- Generate element **fingerprints** (type, ancestry path, bbox, centroid, area, path length, fill/stroke/opacity, text content) for stable re-identification after simplification
- Expand inline styles to attributes where needed
- Canonicalize coordinate systems

### 7.3 Pre-Animated SVG Handling

Detect existing animation constructs (`<animate*>`, `<set>`, CSS `@keyframes`, animated attributes/styles). Present user choice:
- **Start fresh** (default): Strip animations, preserve static t=0 appearance
- **Keep and extend**: Import existing animations into the plan IR as a locked baseline layer; add new animations with conflict warnings when same element/property is already driven

### 7.4 Text & Font Handling

- **Preserve `<text>` by default** for editability and file size
- On import, detect text usage and surface status: "Text uses external fonts; appearance may vary"
- Provide explicit **Convert to outlines** action (non-destructive; store both versions)
- For morph nodes: require text-to-path conversion (prompt user) or fall back to crossfade
- Font embedding reserved as future enterprise/advanced option

### 7.5 Complexity Gating

Compute a backend-only **complexity score** considering:
- Total element count, path count
- Average and max path command length
- Nesting depth
- Filter/mask usage, gradients/patterns
- Text objects
- Estimated Gemini token footprint

Map to plan tiers. When exceeded:
- Clear message: "This SVG exceeds your current plan's processing limits"
- Actions: **Auto-simplify and continue** (non-destructive), Upgrade plan, Download simplification tips
- Auto-simplification: remove hidden/zero-opacity elements, merge identical fills/strokes, flatten trivial groups, reduce path precision, strip unused `<defs>`
- Always preserve visual fidelity at t=0
- Store original, recompute complexity after simplification

**MVP:** Hard complexity limit (no auto-simplification)

---

## 8. Element Targeting

### 8.1 Targeting Surfaces

Three targeting methods (all resolve to canonical `nodeUid` references):

1. **Click-to-select in preview** — user clicks elements in the rendered SVG; system highlights and resolves to internal ID. Natural for designers.
2. **Layer/tree panel** — Figma-like element tree for precision on dense SVGs. Select/lock targets from the tree.
3. **Prompt-only fallback** — describe targets in natural language ("animate the gear icon"). AI resolves using the structured summary.

### 8.2 Stable Targeting

- Targets bind to `nodeUid` (not raw SVG IDs)
- Each element has a fingerprint for re-identification after normalization/simplification
- On simplification: remapping step matches old targets to new nodes by highest-confidence fingerprint similarity
- Low-confidence matches surface "targets need review" for user re-binding
- Support **named target sets** (e.g., `logo`, `background`) reusable across prompts and modifiers

---

## 9. User Experience

### 9.1 Progressive Disclosure

**Linear mode (default for new users):**
Upload → Prompt → Preview → Tweak → Export

Behind the scenes, this creates a single-node graph with optional modifiers. After first successful generation, progressively introduce branching ("Try a variation"), then reveal the full node graph with a clear mental bridge: *"Each version you create becomes a node you can branch from."*

Both modes always accessible.

### 9.2 Node Graph Canvas

- Nodes display **static thumbnails** by default (first frame or key pose)
- Lightweight **inline play toggle** for quick spot-checking without changing focus
- **Selected node** shown in dedicated larger **preview panel** with:
  - Scrubber / timeline control
  - Play/pause, loop, speed controls
  - Comparison tools: original vs. animated, diff/overlay, before/after for morph

### 9.3 Comparison / Diff

Select two nodes → **side-by-side preview** with synced playback controls (play/pause, scrubber, loop, speed). Quick toggles for "first frame", "peak pose", "export size".

**Structured plan diff** alongside: targets added/removed, effects added/removed, duration/delay/easing changes, property channels changed, compiler warnings.

**Overlay toggle** within the preview panel for subtle motion differences.

### 9.4 Job System UX

Generation is **asynchronous and non-blocking**. The UI never feels blocked.

- When generating: show static SVG immediately (t=0 state), subtle progress indicator, high-level stage labels (Parsing → Planning → Compiling), Cancel button
- If >5–7 seconds: show estimated remaining time based on complexity class
- On completion: smooth transition from static to animated, subtle success indicator, notification badge if user navigated away
- For complex SVGs/morph: immediately mark "High complexity — longer processing time"
- Queue priority by billing tier

---

## 10. Morph Animation (post-MVP)

### 10.1 Element Correspondence

**AI auto-match + manual override:**

1. **Normalize both SVGs:** sanitize, expand transforms, convert shapes to paths, canonicalize coordinates
2. **Automatic matching in stages:**
   - Match by identical IDs
   - Match by structural similarity (group hierarchy position)
   - Match by geometric similarity (bbox, path length, centroid proximity)
   - Match by visual similarity (color + area)
3. **Produce correspondence map** with confidence score per pair
4. High confidence → auto-generate morph preview immediately
5. Low confidence / unmatched elements → surface **manual mapping UI:**
   - Side-by-side element lists or overlay selection
   - Drag-to-map or click-pairing
   - Mark elements as fade-in/fade-out instead of morph
   - "Unmatched elements will crossfade" by default

### 10.2 Morph Compilation

Store `correspondenceMap` in the animation plan IR. Morph compiler:
- Normalize path commands to compatible forms
- Interpolate `d` attributes for matched paths
- Fall back to opacity crossfade where path normalization fails

---

## 11. Animation Output

### 11.1 SMIL / CSS Strategy

**Best-fit per property.** The compiler chooses SMIL or CSS per animation property:

- **CSS** for: opacity, transforms on groups/elements, simple color changes — dev-friendly, broad tooling support
- **SMIL** for: path `d` morphing, `animateMotion` along path, SVG attribute animations, cases where `transform-origin`/`transform-box` inconsistencies make CSS fragile

**Compiler rules:**
- One "owner" per property per element (no double-driving)
- Deterministic precedence
- Validation pass that flags conflicts

### 11.2 Browser Support

**Target:** Latest 2 versions of Chrome, Edge, Firefox, Safari (desktop) + current iOS Safari/WebKit.

- "Browser target" is an explicit compiler setting (default: Evergreen + iOS Safari)
- Compiler applies known workarounds for iOS quirks (transform-origin, SMIL timing)
- If no safe equivalent: emit fallback strategy (e.g., degrade `animateMotion` to transform approximation) + surface warning in node
- **Export metadata includes a compatibility report**

### 11.3 Guardrails

**Soft defaults** with warnings and tier-based override controls:

| Constraint | Default | Override |
|---|---|---|
| Max duration | 8–12s | User can increase (with warning) |
| Loop behavior | Off unless requested | User sets loop count or infinite |
| Max animated elements | ~50 | User can increase (with perf warning) |
| Expensive properties | Avoid filters/masks animation by default | User can enable |
| `prefers-reduced-motion` | Always emit reduced-motion variant/snippet | N/A (required) |

Compiler warnings surface as actionable suggestions: "High cost: 180 elements animated; consider targeting fewer layers" with one-click mitigations.

---

## 12. Export

### 12.1 Formats

| Format | MVP | Post-MVP |
|---|---|---|
| Animated SVG (SMIL/CSS) | Yes | Yes |
| Lottie JSON (Bodymovin) | No | Yes |
| Code snippets | No | Yes |
| GIF / MP4 | No | Future (if demand) |

### 12.2 Code Snippets (post-MVP)

- Plain HTML embed (`<img>` / `<object>`)
- Inline SVG usage
- React component wrapper
- Optional lightweight JS fallback

### 12.3 Lottie Export (post-MVP)

**Two modes:**
1. **Best-effort export:** Convert supported features, produce degradation report (dropped features, approximations, affected elements, visual impact)
2. **Lottie-safe mode:** Constraint applied at generation/compilation to restrict to Lottie-supported subset (transforms, opacity, basic shape/path, simple fills/strokes)

Store export constraints in the plan so users can branch: one branch for web SVG, another for Lottie delivery.

### 12.4 Architecture

Animation Plan IR → compile to:
- SVG (SMIL/CSS)
- Lottie JSON (Bodymovin-compatible structure)
- Snippet templates

All exports are deterministic from the IR. No reverse-parsing of compiled SVG.

---

## 13. Error Handling & Recovery

### 13.1 Structural Failures

Invalid SVG, broken refs, malformed SMIL/CSS, ID collisions, missing defs.

- **Never show broken results**
- Server-side validation against canonical animation plan and compiled SVG
- Auto-retry up to N times with structured error feedback injected into prompt
- Internal retries do **not** consume user credits
- If all retries fail: clear error state with "Retry generation" action (still no credit cost)

### 13.2 Creative Mismatches

Valid output that doesn't match user intent.

- Show result immediately
- **Regenerate** button (costs credits — new AI call)
- **"Refine this result"** input that appends structured feedback
- Optional **quick-fix controls** (slower, stronger, different element)
- Iteration should feel fluid and safe

---

## 14. Technical Architecture

### 14.1 Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Node graph | React Flow (xyflow) |
| State | Zustand |
| UI | Tailwind CSS + Radix/shadcn |
| SVG preview | Native `<svg>` rendering with controlled sandboxing |
| Animation scrubbing | Built on Animation Plan IR |

### 14.2 Backend (MVP)

**AWS serverless "request + job" architecture:**

- **Web hosting:** S3 + CloudFront (or Amplify Hosting)
- **API:** API Gateway HTTP API + Lambda (Node.js / TypeScript)
  - Validates requests, enforces quotas, creates idempotency keys
- **Job queue:** SQS → Lambda workers (Gemini calls, SVG parse/normalize, plan compilation, thumbnail renders, export packaging)
  - Per-tenant concurrency caps
- **Storage:**
  - S3 for artifacts (original SVG, normalized SVG, plan JSON, compiled SVG, thumbnails) with lifecycle rules
  - RDS PostgreSQL (t4g.*, single-AZ) for projects/users/billing state
- **Auth:** Cognito or Clerk
- **Billing:** Stripe
- **Rate limiting:** DynamoDB for counters/idempotency (if needed)
- **Monitoring:** CloudWatch logs/metrics

**Client experience:** Submit job → poll job status → fetch outputs from S3.

### 14.3 Backend (Scale-Up Path)

- Aurora Serverless v2 (Postgres) or RDS with read replicas
- DynamoDB for job-state store (burst load resilience)
- Split queues by workload class (fast compile / heavy morph / export) with separate Lambda worker pools
- Dead-letter queue + idempotent retry semantics
- Aggressive caching keyed by canonicalized SVG + prompt + settings + schema version
- Push updates via SNS → WebSocket (API Gateway WebSocket)
- WAF, stricter edge rate limiting
- Structured tracing (X-Ray / OpenTelemetry)
- S3 Intelligent-Tiering for storage cost management
- Tier-based priority queues

---

## 15. Data Model

### 15.1 Core Entities

```
Workspace
├── id, name, plan, creditBalance, creditAllowance
├── members[] → { userId, role: Owner|Editor|Viewer }
├── settings: { telemetryOptOut, retentionDays }
└── projects[]

Project
├── id, workspaceId, name, createdAt, updatedAt
├── graph: { nodes[], edges[] }
├── shareLinks[] → { token, mode: view|comment|fork, password?, expiresAt? }
└── comments[]

Node
├── id, projectId, type: generation|morph|modifier
├── status: pending|generating|compiling|completed|failed|canceled
├── inputs: { svgRef, prompt, targetSet[], settings }
├── artifactBundle: { planJson, compiledSvgRef, thumbnailRef, metadata }
└── parentNodeId? (for chaining/branching)

Edge
├── id, sourceNodeId, targetNodeId
└── type: "derived-from"

Artifact (separate table/object)
├── id, contentHash, s3Key, mimeType, sizeBytes
└── createdAt

Job/Run
├── id, nodeId, attempt, status
├── geminiRequest, geminiResponse (refs)
├── validationResult, retryReason?
└── timestamps: { queued, started, completed }

Comment
├── id, projectId, nodeId?, userId
├── body, resolved, createdAt
└── parentCommentId? (threading)
```

### 15.2 Immutable Artifact Bundles

Every generation produces an immutable snapshot:
- Sanitized input SVG reference
- Animation plan JSON
- Compiled animated SVG reference
- Thumbnail reference
- Metadata: prompt, target set, timestamps, model identifier, compiler version, schema version, complexity score, seed (if available)

Users can always return to and export the exact output they approved.

---

## 16. Permissions & Sharing

### 16.1 Workspace Roles

| Role | Capabilities |
|---|---|
| **Owner** | Full control: billing, members, settings, all project operations |
| **Editor** | Create/modify projects, generate, export |
| **Viewer** | Read-only access + commenting |

Applied at workspace level. All projects in a workspace inherit the same permissions.

### 16.2 External Sharing

Project-level sharing with external users (no workspace membership required):
- Link-based access: **view-only**, **comment-only**, **fork-only** (creates copy in recipient's workspace)
- Optional password + expiry
- Audit log of link access (Team/Enterprise tier)

Implemented as access policy / share token attached to the project.

---

## 17. Billing & Pricing

### 17.1 Model

**Hybrid subscription + usage-based.** Subscription tiers provide stable MRR; usage-based overages protect margins.

Each plan includes a monthly **compute credits** allowance. Credit cost scales by SVG complexity + generation type (morph costs more). Modifier nodes are unlimited (free).

### 17.2 Tiers

| Tier | Included | Features |
|---|---|---|
| **Free** | Limited generations/month | Watermark or lower complexity cap |
| **Pro** | Generous allowance | Commercial license, priority queue |
| **Team** | Pooled credits | Shared projects, higher concurrency, async collaboration |
| **Overage** | Pay-per-credit beyond plan | Clear per-credit rate |

Optional: Bulk credit packs for power users.

---

## 18. Collaboration (post-MVP)

**Async + comments** (no real-time co-editing):

- Shareable project links (view-only or editable)
- Forking (new project tied to original lineage)
- Role-based access (Owner/Editor/Viewer)
- Node-level comments with timestamps
- "Resolve" comment threads
- Mention notifications
- Snapshot comparison (Node A vs Node B diff view)

Architecturally: comments stored with node IDs, immutable generation outputs, fork creates new root reference. No CRDT layer required.

---

## 19. Determinism & Versioning

- **Immutable snapshots** are the reproducibility guarantee — anything generated is permanently retrievable and exportable
- Version-stamp everything: model identifier, compiler version, schema version
- Best-effort controls: "generate a variation" (explicitly nondeterministic) vs. "try to stay close" (reuse prior plan as context)
- Store seed if API supports it, but no hard guarantee of identical regeneration
- Historical outputs retained alongside plans so compiler/schema evolution doesn't break past results

---

## 20. Telemetry & Quality Loop

### 20.1 What's Logged

- Prompt text
- SVG metadata (complexity score, element types, feature flags)
- Validation failures (what broke and why)
- Regenerate frequency (per node/prompt)
- Time-to-export and export rate
- Manual overrides (changed targets, retimed animation)
- Degradation events (Lottie export drops, morph fallback)

### 20.2 Privacy Posture

- Raw SVGs stored only for user's own project — **never used for model training**
- Prompts and metadata logged for product improvement
- Explicit disclosure in ToS
- **Opt-out** available for telemetry collection
- Enterprise tier can disable all prompt logging
- No cross-user content exposure
- 90-day telemetry data retention
- Structured analytics stored separately from project storage
- Strip identifiable metadata where possible

### 20.3 Feedback Loop

Telemetry feeds into:
- Prompt template improvements
- Weak effect pattern identification
- Model regression detection
- Complexity limit tuning
- Compiler heuristic refinement
- Automated test suites

---

## 21. MVP Scope

**The MVP validates one thing:** *Can AI reliably turn static SVGs into production-ready animated SVGs that people actually want to use?*

### Included in MVP

- Linear mode (upload → prompt → preview → export)
- Basic node graph (branch from a result, try variations)
- Generation nodes only (each = one AI call)
- SVG export only
- Auth (email/social login)
- Free tier with limited generations
- Hard structural validation + auto-retry
- Basic SVG sanitization (allowlist-based)
- Hard complexity limit (no auto-simplification)
- Background job system with polling

### Explicitly Excluded from MVP

- Morph nodes
- Modifier nodes
- Lottie export
- Code snippets export
- Team tier / collaboration
- Auto-simplification
- Additive layering mode
- Element targeting UI (click-to-select, layer panel) — prompt-only targeting in MVP
- Visual diff / comparison tools
- Real-time WebSocket updates

### MVP Graph Behavior

- Nodes = generation outputs
- Edges = "based on" (derived-from)
- No merging logic, no layering, no composition rules

---

## 22. Post-MVP Roadmap (Priority Order)

1. **Modifier nodes** — deterministic retiming, easing, intensity scaling
2. **Element targeting UI** — click-to-select + layer panel
3. **Visual diff / comparison** — side-by-side + plan diff
4. **Morph animation** — correspondence mapping + morph compilation
5. **Lottie export** — best-effort + Lottie-safe mode
6. **Code snippets** — HTML, inline SVG, React component
7. **Auto-simplification** — smart SVG optimization
8. **Additive layering** — explicit merge mode with conflict rules
9. **Team tier & collaboration** — workspaces, async comments, sharing
10. **WebSocket updates** — push notifications for job completion
