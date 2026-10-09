# ReachBee — User Flow: Simplify & Enhance

Date: 2026-10-09 · Companion to [`userflow.md`](./userflow.md) (the flow reference at commit `2f55ca3`)

Method: every finding below was re-checked against the current source, not against
`userflow.md`. Three of its claims turned out to be stale (§6). Nothing here was
observed in a browser — see §7 for what that means for confidence.

Legend: **E** = verified in code at file:line · **I** = inferred from code, not executed.

---

## 0. Status after the fix pass (2026-10-09)

Every finding below was then acted on, and the flow was re-walked in a real browser
(dev server, local database, labeled offline sample model — no provider calls).

| Item | Status | Verified how |
| --- | --- | --- |
| S1 unreachable draft reuse | **Fixed** — reuse now judged from revisions | typecheck + query rewrite |
| S2 onboarding screens, write-on-GET | **Fixed** — Gmail step removed (4→3), completion moved to `POST /api/v1/onboarding` | browser: profile → resume → done, `onboarding_step=complete` written only after the click |
| S3 fabricated profile fact | **Fixed** — the composer gate now asks for the user's own name + one sentence; onboarding's invented `experience` fact deleted | browser: gate → confirm → draft signed "Sam Iyer" |
| S4 new resume never used | **Fixed** — `getPendingProfileReview` surfaces it in the composer rail and dashboard | code + typecheck |
| S5 `retryAfter` dropped, unsafe JSON parse | **Fixed** — countdown on the button, `readJson` guard | code |
| S6 UTC reset copy | **Fixed** — the composer shows the reader's own clock; pricing, help and legal now state `00:00 UTC / 05:30 IST` | browser: "5:30 am your time" |
| S7 IA, dead code | **Partly** — `PreferencesStep` and the gmail step deleted; `/app/resumes` left out of the sidebar (reachable from Career profile, which is where it belongs); two orphan pages left | browser |
| S8 marketing | **Corrected** — the homepage newsletter is *not* a dead end (the component self-submits); footer placeholder socials replaced with real internal destinations | read `ui/newsletter/index.tsx` |
| S9 dashboard one next step | **Fixed** — renders all, plus a new no-AI-credits step | browser: two steps visible |
| E1 grounding panel | **Built** — `getGroundingClaims` → API → composer | browser + integration test |
| E2 invisible late success | **Fixed** — poll window ~9 min, resumes on mount, `generation.ready` / `generation.failed` notifications, notices link to the draft | browser: worker ran after the click, panel appeared, notification listed with "Open the draft" |
| E3 per-fact approval | **Built** — checkboxes, subset `PUT`, and typed-in additions no longer silently dropped | integration test |
| E4 revision provenance | **Fixed** — the proposal names the profile revision and source it was grounded in | integration test, both live and reload paths |
| E5 actionable warnings | **Fixed** — each warning links or focuses its fix | browser: "Review company evidence" |
| E6 `.eml` decrypt 500 | **Fixed** — `decryptContactEmail` degrades to no address instead of 500 | code |

### Found while verifying in the browser, not in code

1. **`I'm .` in a real draft.** An account with no `display_name` produced
   `I'm . I cut p99 latency 40%…` and a doubled `..`. The name is required for the
   greeting and sign-off, so the gate now collects it; the sample model no longer
   emits a blank or double punctuation; and `PROMPT_SYSTEM` forbids a blank
   self-introduction.
2. **Raw sentinel codes shown to users.** `safeMessage` promises never to echo
   internal errors but echoed any unmapped code, and `RevealError` /
   `OpportunityError` hard-coded `message: "RATE_LIMITED"` / `"CONFLICT"` /
   `"NOT_FOUND"` — bypassing it entirely. A throttled reveal printed
   `RATE_LIMITED`. `code` stays exactly as contracted; `message` is now human, and
   an unmapped `ALL_CAPS` code can no longer reach the screen.
3. **A hydration error on every composer load.** Rendering `toLocaleTimeString`
   during SSR made the server (UTC) and browser (IST) disagree — introduced by the
   S6 fix itself and only visible in a browser. Now set in an effect after mount.
4. **The proposal was rendered twice**, with two sets of Apply/Dismiss buttons for
   one decision. The editor card owns it; the rail now points there.
5. **The target role vanished on reload**, so a second generation silently lost the
   role context the first had — it is now seeded from the confirmed profile.


## 1. The loop today, and what it costs

The repeatable core is `reveal → save → write → generate → accept → approve → deliver`
(`userflow.md:407`). The problem is not the loop — it is everything that must be true
before the loop can start, and what is thrown away after it finishes.

| Measure | Current | Evidence |
| --- | --- | --- |
| Screens, signup → first AI draft | **8** (4 onboarding + 4 workspace) | **E** `/sign-up` → `/onboarding/profile` → `/resume` → `/gmail` → `/complete` → `/app` → `/app/drafts/new` → `/app/drafts/[id]` |
| Screens, fastest observed path | **4** (`/sign-up` → `/app` → `/drafts/new` → composer, via 1-Click Activate) | **E** `dev-signin-form.tsx:41`, `onboarding-steps.tsx:141-143` |
| Server gates that can refuse a Generate click | **8** codes | **E** `generations.ts:33-44` |
| Client polling window vs server working time | **~187s vs up to ~560s** | **E** `composer.tsx:282-291`, `generations.ts:231-232`, `runner.ts:125`, `ai.ts:520` |
| Grounding evidence stored but shown to users | **100% stored, 0% shown** | **E** written at `handlers.ts:177-185`; zero readers in `src/app`, `src/components`, `src/server/services` |
| Draft rows created per "Create an introduction" click | **1, always** (reuse is unreachable) | **E** `drafts/new/page.tsx:27-48` + `drafts.ts:84` |

Two of those rows are the whole story: the app promises *"AI drafts are written only
from details you have confirmed"*, and it stores exactly the data that would prove it —
then never renders it. And the server keeps working for six minutes after the screen
stops looking.

---

## 2. Simplify — remove steps, dead ends and surprise gates

Ordered by user impact per unit of work.

### S1. Draft-list pollution: the reuse query can never match · **E** · Small

`/app/drafts/new` tries to reuse a recent empty draft (`drafts/new/page.tsx:27-48`, with
a comment saying so) by joining `drafts.currentRevisionId → draft_revisions.id`. But
`createDraft` sets `currentRevisionId: null` (`services/drafts.ts:84`), autosave updates a
revision in place without ever linking it (`drafts.ts:248-261`), and the **only** writer of
that column is `accept_generated_proposal` (`db/functions.sql:468` — the sole non-null write;
the only other mention is the `null` reset) — which by definition
means a draft that has a non-empty accepted proposal, which the `subject='' AND body=''`
filter then excludes. The join is unsatisfiable, so the fallback at `page.tsx:50` always runs:
**every visit mints a row.**

Consequence: the drafts list fills with abandoned empty shells, which is the first thing a
new user sees on their second session.

Fix: match on revisions by `draftId` + `revisionNo = 1` and empty content, or drop the join and
filter `currentRevisionId IS NULL`. Either way, add a test — the dead reuse shipped because
nothing asserted it.

### S2. Onboarding is four screens, one of which writes the database on GET · **E** · Medium

`stepOrder = ["profile","resume","gmail","complete"]` (`onboarding/page.tsx:8`). A new user
must clear four screens before seeing the product, and the last one mutates during render:
`await setOnboardingStep(user.id, "complete", true)` sits in the server component body
(`onboarding/complete/page.tsx:14` → `services/resumes.ts:356-361`). A prefetch or re-render
writes. That is a side effect in a GET.

Also note the ordering puts **Gmail OAuth before the user has ever drafted anything** — the
hardest ask comes second-cheapest in value.

Fix: collapse to one screen (name + target role + first real fact, then straight to the
composer); move Gmail to the moment of first delivery, where it is self-evidently needed; make
completion an explicit mutation (server action or `POST`), never a render.

### S3. "1-Click Activate AI Profile" invents a fact · **E** · Small, high-severity for trust

`composer.tsx:135-153` (`quickActivateProfile`) posts a single synthesized summary fact —
`` `Software engineering professional targeting ${targetRole.trim()} opportunities.` `` (`:149`,
or `"Software engineering professional seeking relevant career opportunities."` at `:150` when no
role is set) — with `approve: true` (`:153`), purely so the `NO_CONFIRMED_FACTS` gate
(`generations.ts:149-155`) opens and Generate becomes clickable.

That is the app's central promise, quietly broken by its own escape hatch: the user never
confirmed that sentence, and from then on every draft is grounded in it. It also makes S4
and E1 partly decorative.

Fix: the 1-click should pre-fill the review screen and ask for one confirmation tap on the
facts it created, not write them as `approved: true` on the user's behalf. Keep the shortcut,
put the confirmation back in it.

### S4. A new resume never reaches the AI, silently · **E** · Medium

Resume parse inserts facts with `approved: false` and no `approvedAt`
(`jobs/handlers.ts:797-806`), and updates only `activeResumeId`, not `currentRevisionId`
(`handlers.ts:807-810`). So the previously approved profile keeps supplying every draft while
the new resume's facts sit unseen. A notification exists (`handlers.ts:818-825`) but nothing
blocks or warns in the composer.

The user does the work (upload a better resume) and gets no change, with no signal why. This
is a flow that *looks* like it has a step and doesn't.

### S5. `retryAfter` is computed by the server and thrown away · **E** · Small

The preflight returns `retryAfter` for `RATE_LIMITED` and `DAILY_LIMIT_REACHED`
(`generations.ts:102,175`), the route carries it, and the composer discards it: it shows the
message verbatim (`composer.tsx:356-362` → `:660`) with no countdown. "Try again later" with
no number is the copy that makes people click again immediately.

Related: `composer.tsx:352` awaits `res.json()` unguarded, so an HTML 500 from a proxy surfaces
as a raw `SyntaxError` string in a red box. Wrap it.

### S6. Quota resets are stated in UTC · **E** · Small

*"the limit resets at midnight UTC"* appears in four user-facing places — the blocking error
(`generations.ts:174`), pricing (`pricing/page.tsx:30`), help (`content/help.ts:29`) and terms
(`content/legal.ts:74`). For an INR/Razorpay product that is 05:30 IST, so "today" ends
mid-morning for the actual audience. Render a local-time reset or the countdown from S5.

Also worth reconciling: pricing sells the cap as **"Deliverability Shield"** (a benefit), while
the composer delivers the identical limit as a red failure. Same fact, two framings — pick the
benefit framing at the point of block.

### S7. Workspace IA · **E** · Medium

- `/app/resumes` is not in the sidebar; it is reachable only from `/app/profile` breadcrumbs and upload flows (`userflow.md:385`). The thing that produces facts is harder to find than the facts.
- Settings is six sub-pages (`profile`, `integrations`, `notifications`, `security`, `privacy`, plus a bare redirecting `/app/settings` that returns 200, not 307).
- Two orphans have no inbound link anywhere: `/auth/session-expired`, `/service-unavailable` — **I**, carried over from `userflow.md:195-200`; I did not re-run that repo-wide link search.
- Dead code from the retired step: `PreferencesStep` returns `null` (`onboarding-steps.tsx:211-213`) and is imported-but-unused by `onboarding/complete/page.tsx:7`.

### S8. Marketing CTAs that go nowhere · **E** · Trivial

Homepage `Newsletter1` is passed no `onSubmit`, so submitting fires a native GET and reloads
the page (`(marketing)/page.tsx:40-46`); footer social links point at bare
`https://x.com`, `https://linkedin.com`, `https://github.com`
(`footer-25/index.tsx:134-136`). The footer subscribe form is *not* a dead end any more
(`footer-25/index.tsx:15-38`) — it posts for real.

### S9. The dashboard hides all but one next step · **E** · Trivial

`/app` builds a next-steps list and renders `nextSteps.slice(0, 1)` (`app/page.tsx:126`). On the
screen a confused user lands on, the product shows exactly one of the things they could do.

---

## 3. Enhance — make the moments that exist pay off

### E1. Ship the grounding panel — the data is already stored and unread · **E** · Medium · highest value

`draft_claims` holds, per draft, the exact `excerpt`, the `factIds`/`evidenceIds` that support
it, and a `validationResult` (`handlers.ts:177-185`, schema in `db/schema.ts`). **Nothing reads
it.** No route in `src/app/api/v1/**`, no service, no component references `draftClaims`.

So the single claim that differentiates ReachBee from "AI writes your job applications" is
currently unverifiable by the user, while `acceptProposal` asks them to trust it. The composer
shows only a count (`usage.factsUsed`, `composer.tsx:307`).

Build it from what exists: under the proposal, list each claim's excerpt with the confirmed
fact behind it, and flag `uncertain` claims (already written when no ID supports them) as
needing the user's eye. No schema change, no provider change, no new model output — the write
path is already proven, including by `tests/integration/draft-generation.test.ts`, which asserts
every cited fact ID was one the user approved.

### E2. Late-success invisibility · **E** · Medium

Numbers: the client sleeps 2s, 5s, then 10s × 18 ≈ **187s** (`composer.tsx:282-291`). The server
budget is `maxAttempts: 4` (`generations.ts:231`), each attempt up to two `compose` calls
(`handlers.ts:135,141`) at a 60s provider timeout each (`ai.ts:520`), plus backoff
`min(retryAfterSeconds, 300)` (`runner.ts:125`) — **up to ~560s**, and attempt 2 alone can land
past 187s.

So the normal sequence on a slow provider is: spinner, then
*"Still working on it. Reopen this draft in a moment to see the result."* (`composer.tsx:317`),
then — often — a validated draft that **consumes the credit** (`generations.ts:228-231`) into a
screen nobody is watching. `pollGeneration` is called only from `startGeneration`
(`composer.tsx:360`); nothing resumes it on mount.

Three-part fix: resume polling on mount whenever `initialGeneration` is in a
queued/generating state; extend or make the window derive from the real job budget; and emit a
notification when a generation reaches `ready`, since `/app/notifications` and the notification
row already exist (`handlers.ts:818-825` shows the pattern). A user should never have to guess
whether they were charged.

### E3. Per-fact confirmation · **E** · Medium

"Confirm these facts" approves *all* facts on the revision in one call
(`profile-facts-editor.tsx:145-148` → `PUT /api/v1/profile` → `approveProfileRevision`,
`resumes.ts:290-304`). Per-fact approval does not exist; the only granular controls are delete
(`:104-110`) and add (`:78-82`). One wrong parsed line forces either deleting it or approving it.
This also weakens the sentence the app puts on the composer's banner (`composer.tsx:740-756`).

### E4. Supersession should be visible, not silent · **E** · Small

The moment a user confirms a new revision, `currentRevisionId` repoints and the old approved
profile is replaced with no record shown of what changed. Given drafts are generated from a
pinned `profileRevisionId` snapshot (`generations.ts:210`), show which profile revision a draft
was written from — it makes E1 concrete and makes S4 discoverable.

### E5. Make the new warnings actionable · **E** · Small

Grounding warnings now persist (`handlers.ts:201-207`), reach the API contract and render in the
composer (`composer.tsx:679`, `:793`), including a `placeholder_text` detection for fill-in
blanks. Each currently ends as a sentence. Each has an owner action: `missing_role_context` → set
target role, `missing_company_context` → approve evidence on the company page, `placeholder_text`
→ jump to the offending line. Turn the copy into links.

### E6. Two small completion-moment gaps · **E** · Trivial

- After accepting a proposal the composer gives no path to the next step; approval, Gmail push and `.eml` export all live in the same rail but nothing sequences them.
- `.eml` export, previously logged as DEF-2, is now sound: `exportEml` → `buildMimeMessage` (`mime.ts:111`), with 404/410 handled (`export.eml/route.ts:11-16`) and `toEmail` pre-validated with a fallback (`services/drafts.ts:377-380`). One uncaught path remains — `decryptEnvelope` inside `getDraftForUser` (`drafts.ts:129`) can throw on key rotation and 500s the download.

---

## 4. Proposed simplified spine

Four screens from signup to a reviewed AI draft, with no fabricated facts:

1. **Sign up** → straight into one onboarding screen: name, target role, and the facts to
   confirm — seeded from a resume when uploaded, otherwise three prompts the user fills.
   Confirmation stays an explicit user act (fixes S3).
2. **Composer**, pre-addressed if they came from a contact. Requirements shown as a checklist
   that is already ticked by step 1, not discovered at the Generate click.
3. **Proposal + grounding panel** (E1) with warnings that link to their fix (E5).
4. **Delivery** — Gmail connect asked here (S2), or copy / `.eml` if declined.

`/app` then becomes a follow-up surface (pipeline, saved contacts, credits) rather than a gate
the user has to pass through on the way to their first draft.

---

## 5. Priority order

| # | Item | Severity | Effort | Why this rank |
| --- | --- | --- | --- | --- |
| 1 | S3 — stop auto-approving a fabricated fact | High | Small | Breaks the product's core claim; one function |
| 2 | E2 — resume polling on mount + notify on ready | High | Medium | Users are charged for results they cannot see |
| 3 | S4 — new resume's facts never used, silently | High | Medium | Invisible dead work; users stop uploading |
| 4 | E1 — grounding panel from `draft_claims` | High | Medium | Unused data; the actual differentiator |
| 5 | S1 — unreachable draft reuse | Medium | Small | List pollution on every visit |
| 6 | E3 — per-fact confirmation | Medium | Medium | Grounding precision, moderate build |
| 7 | S2 — collapse onboarding, move Gmail later | Medium | Medium | Biggest signup drop lever |
| 8 | S5 — countdown + safe error parsing | Medium | Small | Cheap; reduces retry storms |
| 9 | S6 — local reset time, benefit framing | Low | Small | Trust and clarity |
| 10 | E5 — actionable warnings, E4 — revision shown | Low | Small | Follows from work already landed |
| 11 | S7 — IA, orphans, dead code, S8, S9 | Low | Small | Hygiene, each small |

---

## 6. Corrections to `userflow.md`

It is otherwise thorough, so flag these explicitly rather than silently diverging:

1. **§Journey 3, "Latent dead end — `preferences` in `stepOrder`"** — no longer true. Current
   `stepOrder` is `["profile","resume","gmail","complete"]` (`onboarding/page.tsx:8`); every step
   has a page. The residue is dead code, not a 404 (S7).
2. **§4.1 step 9, ".eml export returns HTTP 500" (DEF-2)** — largely closed; only the
   `decryptEnvelope` path remains (E6).
3. **§4.1 step 9, "every visit mints a new draft"** — the *intent* to reuse now exists in code but
   is unreachable, so the outcome is unchanged. Worth restating as a bug rather than a design
   fact (S1).
4. **§4.1 step 16 / Journey 3** — the doc does not mention that the composer's profile escape
   hatch auto-approves a synthesized fact (S3). That is the most consequential flow fact missing
   from it.

---

## 7. What was and was not verified

- **Browser-verified after the fix pass.** The signup → gate → recipient → generate →
  proposal → reload → notification path was walked in a real browser against a local
  database with the labeled offline sample model. That is what surfaced the five issues
  in §0 that code reading missed, including the hydration error my own S6 fix introduced.
- **Not walked:** mobile and tablet widths, the directory/reveal flow end to end,
  templates, pipeline, settings sub-pages, admin, and the payment loop. The composer is
  dense (compose + intent/mode + recipient + delivery + export + profile state) and
  almost certainly has further progressive-disclosure wins that this pass did not assess.
- **No live provider run.** OpenRouter's free-model daily cap was exhausted during the
  AI drafting work, so the timing figures in E2 are derived from the code's own budgets
  and measured per-call latencies, not from a fresh timed generation. The browser pass
  deliberately used the sample model so no token was spent.
- **No funnel data.** Impact rankings are reasoned, not measured — there is no analytics
  in the repo tying these steps to drop-off. If event data exists anywhere, the S2/S3/S4
  ranking is where I would most want it confirmed.
- **One deliberate contract change.** §0 item 2 changes the `message` text of three error
  envelopes that tests had pinned as raw codes. `status` and `code` are unchanged, so
  machine clients are unaffected; the pinned rows in `tests/unit/error-maps.test.ts` were
  updated to the new copy rather than the assertion being dropped.

