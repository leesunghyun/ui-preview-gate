---
name: ui-preview-gate
description: Use whenever a turn suggests, gives an opinion on, designs, or implements anything that changes what users see - new or changed screens, tabs, buttons, fields, layout, copy, or user-facing features, including LINE/chat message cards, push notifications, emails, and extension popups - even when the user does not name this skill, even mid-conversation in a follow-up turn, and even when the change emerges from a support/CS, research, review, debugging, or audit conversation. This includes bug fixes whose fix changes what users see (e.g. an error sheet replaced by another), lists or tables of proposed screen changes, "is it possible?" assessments, and ideas for what to show users. Also use whenever before/after images, UI screenshots for approval, or mockups are requested. Approval gate for UI/UX and feature changes - inspect the real current screen and code, get explicit approval on a side-by-side before/after preview before coding, then verify the result against it. A text-only proposal or case table is not enough. Not for merely attaching screenshots to a finished PR, and not for backend-only or invisible changes.
license: MIT
metadata:
  tags: "ui, ux, before-after, screenshots, approval, design-review, playwright"
---

# UI Preview Gate

Every change that alters a screen moves through four phases. Do not skip a phase
because the change looks small; the images are what reviewers approve.

1. Inspect the current state
2. Preview and get approval (before work starts)
3. Implement
4. Verify the result matches the approved preview (after work ends)

Exception: a bug fix that does not change the intended screen may skip phase 2.
If users can still see a difference, report before/after images with the fix.
Showing a different screen, dialog, sheet, or message than before is a screen
change, not this exception - even when it reuses an existing component. Get
phase 2 approval first.

## When this applies

- Apply it without being asked. Users should never have to name this skill.
- Check every turn, not only the first. A conversation that started as support,
  research, review, or a bug report often turns into "what if the screen did X?"
  halfway through; from that turn on, this skill applies.
- "What do you think?", "any ideas?", and "how would it look?" about a screen
  count as proposals.
- "Is it possible?" and assessments count too when the recommendation changes
  what users see. Surfaces outside the app count: LINE or other chat messages
  and cards (e.g. Flex), push notifications, emails, and extension popups.
- Never ask for a go-ahead, or for a pick between options, on a UI change before
  its before/after image is in the same reply. If making the image needs a step
  that itself needs approval (e.g. a test send), ask only for that step, and ask
  about the change itself later, with the image. A brief from someone else that
  says "assess first" or lists the image as one item does not relax this.
- Once started, keep following it in later turns until the approved change is
  verified (phase 4) or the user drops the change.
- Exception: translation/localization only (copy moved into another language,
  no layout or behavior change) needs no before/after image or prior approval.
  Instead, confirm with an automated check that existing-language screens are
  unchanged, and list the changed strings (before → after) in the PR. If layout
  or behavior changes too, the exception does not apply (2026-10-26 Dave).
- A proposal answered only in prose or a case table is incomplete. Attach the
  before/after image in the same reply, or say why it cannot be made yet and when
  it will be.
- While a UI change is awaiting approval or in progress, progress reports,
  option lists, and questions about it must also re-attach its before/after
  image. Never describe the changed screen in prose alone.
- "Attach" means the image displays inline in the chat (e.g. Markdown
  `![](/absolute/path.png)`). A bare file path is not enough.
  In the Claude desktop app, Markdown images may not render: also send every
  preview/verification image with `SendUserFile` (`display: "render"`) in the
  same turn so the approver actually sees it (2026-10-24 PO). When the capture is
  tall (a full mobile page), also embed a crop of the changed region so the text
  stays readable at chat size.

Skills are usually selected per turn from their description, so mid-conversation
turns can be missed. `agent-instructions.md` next to this file is a short rule to
add to AGENTS.md / CLAUDE.md so the agent re-checks every turn.

## 1. Inspect the current state

Never propose from memory or guesses.

- Capture the real screen from a running dev server or build. Default viewport is
  mobile 375px wide; add desktop when the change also affects desktop layouts.
- Read the code that renders it: tab/route structure, components, current copy.
- Record evidence as `path/to/file:line` plus the capture. Every claim about the
  current UI should point at one of them.
- Prefer existing components, patterns, and copy. If a new pattern is needed,
  state why the existing ones do not fit.

Capture with `scripts/capture.mjs` (see Scripts) so the before shot, the preview,
and the verification shot share one viewport, scale, and data state.

### Case inventory (do this unprompted, before the first preview)

The approver should never have to ask "what about after tapping it?" or "what
if there is data?". Before sending any preview, list every case the change
touches, from the code and the real app:

- **States of the changed screen:** empty / has data / many items (truncation,
  "see all") / loading / error / locked by plan, role or permission / other
  configurations (single vs. multi-store, feature flags).
- **Every screen reached from a new or changed control:** forms, pickers,
  dialogs, validation errors, cancel/back, confirmation, success, failure.
- **After the action:** how the originating screen looks once the action
  completes (new item appears, counters change), and how to undo or edit it.
- **Other places that show the same data:** lists, detail screens, history,
  reports, exports, other platforms (desktop, Web, LINE, customer side). Mark
  each as changes / unchanged-but-shows-new-data / unaffected.

Send the inventory as a table with the first preview: case, what the user sees,
existing component reused, and image status (attached / needs test data -
how it will be prepared / out of scope - why). Previews may arrive in batches,
but the first message always shows the whole inventory, and approval of one
image never implies approval of cases not yet shown. Propose sensible defaults
for open decisions instead of only listing questions.

## 2. Preview and get approval

Before writing implementation code, show the approver one side-by-side image and
a short summary, then wait for an explicit OK.

What counts as OK: the approver's own reply to the image you showed that clearly
approves it ("OK", "approve", or picking that option). "Continue", "keep
going", or an answer to a different question is not approval of the image, and
neither is a message relayed by another session or subagent unless it quotes
the approver's answer to that image. Until then, build only the prototype used
for the after capture: do not implement for real, commit to the main work
branch, or merge.

Ask for approval as a two-way choice only: **OK / Revise** (revise = say what
to change). Do not offer "proceed / narrow scope / hold" style options, and
never put the approval question in the same message as another question
(deploy, merge, scope). A direct affirmative answer to this approval question
from the approver counts as OK, in any language (e.g. "Yes", Korean 「네」「응」
「ㄱㄱ」「하세요」). Never ask them to re-answer with a specific word. Once the
preview is approved and the result is verified, merging is not a new approval
question; follow the project's merge rule instead of asking again
(2026-10-27 Dave).

If code or a PR for the change already exists, say so, do not merge it, and get
approval on the before/after first. Merging counts as implementing.

Image rules:

- Before on the left, after on the right, in one image.
- Box every changed region: red on before, green on after.
- Pair the boxes: every change gets a box on both sides at the matching place.
  For an addition, mark the insertion point on before with a thin marker in the
  gap (`"pad": 0`, small `h`); for a removal, mark the gap on after. Never box
  an unrelated neighbour (e.g. the row below) to stand in for a missing element.
- Take box coordinates from `capture.mjs --selector` output (or element rects
  measured with Playwright in an e2e test when the state needs interaction, e.g.
  a dialog that opens after input), not by eye. Look at the composed image
  before sending it to confirm each box sits on its target.
- Same viewport, scroll position, and sample data on both sides.
- If the screen branches by state (data present/absent, error, empty, per role
  or per configuration), show one before/after pair for every state the change
  touches. A state you did not show is not approved.
  Make one image per state; never put several pairs in one image.
- A real screen reached only by staging (code temporarily changed to open it)
  must carry `"staged"` in the spec so the image says so.
- Pre-send check: compose.mjs rejects specs that break these rules and prints a
  checklist. Open the image, answer every item, and put the answers in the
  message (see templates). If an item fails, fix and recompose; never explain
  a failed item in text instead.
- Follow the image policy below.

### Image policy

The user or project decides whether mockups are allowed. Look for the choice in
the request or project instructions (AGENTS.md, CLAUDE.md, contributing docs).
If nothing is stated, use `real-only`. Never switch to `mockup-allowed` on your
own because capturing is hard; ask instead.

- `real-only` (default): both sides are full-screen captures of the real running
  app. Build the after side on a prototype branch or behind a feature flag and
  capture it. Never use cropped or pasted fragments, mockups redrawn from code or
  by hand (including generated images), captures that cut a row in half, or
  dummy data that differs from what the real app shows.
- `mockup-allowed`: the after side may be a mockup only when the user or project
  explicitly allows it. The before side is still a real capture. Mark every
  mockup panel with `"mockup": true` in the compose spec so the image shows it,
  and state it in the approval request. A mockup never counts as phase 4
  evidence: verification always uses a real capture of the implemented screen.

A stricter project rule always wins over a looser user preference; if they
conflict, point it out and follow the project rule.

Summary (use [references/templates.md](references/templates.md)):

- Where: which screen/tab and where on it the change appears
- What becomes possible, per user type (e.g. admin, customer)
- What does not change, and the affected platforms/surfaces

Approval covers exactly what was shown. Anything outside it needs a new preview.

## 3. Implement

Build to the approved preview. If implementation forces a visible deviation
(layout, copy, behaviour, new platform impact), stop and return to phase 2 with
an updated preview rather than shipping the difference.

This includes small copy edits and fixes made in response to code review: if a
fix changes what users see beyond the approved images, stop and get a new
preview approved first. Reporting it afterwards in text does not count.
Asking is not enough either: wait for the answer before committing or merging.

After approval, any screen or copy change not in the approved preview (e.g. a
stopped animation, a hidden item, changed numbers) needs its own before/after
image of just that part, approved with OK, before it ships. A text note or an
amber box in the phase 4 image does not replace this.

## 4. Verify against the approved preview

Do not report completion from the code diff alone.

1. Re-capture the implemented screen with the same capture settings and state
   used for the preview.
2. Compose a verification image: approved preview | actual result. Box each
   promised change; box every difference from the approved preview in amber,
   even a small shift. A difference described only in text is not verified.
3. Check, item by item:
   - every promised change is present and matches the preview;
   - everything listed as "does not change" is unchanged;
   - nothing outside the boxed regions moved, wrapped, or overflowed;
   - the changed interaction actually works when exercised, not just renders.
   Passing e2e tests confirm behaviour only; they do not replace the image check
   for each state that should look unchanged.
4. Decide:
   - Match: report with the verification image and the checklist result.
   - Minor mismatch within the approved intent: fix, re-capture, re-check.
   - Mismatch that changes what was approved: report it and get approval again.

List anything you could not verify (a platform, a device, real data) separately
instead of calling it done.

## Scripts

Both scripts need Node 18+ and Playwright (`npm i -D playwright && npx playwright
install chromium`). Without it they search `~/workspace` (or `PLAYWRIGHT_SEARCH_ROOTS`)
for an install whose headless Chromium is already cached and use the newest one.
Set `PLAYWRIGHT_MODULE` to force a specific install.

Capture a screen and get box coordinates for elements:

```bash
node scripts/capture.mjs --url http://localhost:3000/menu --out before.png \
  --width 375 --selector ".category-tabs" --selector ".menu-list"
```

It prints the selectors' rectangles in CSS pixels, ready to paste as `boxes`.

Compose panels from a JSON spec:

```bash
node scripts/compose.mjs spec.json
```

Spec format, tones, and the verification layout are in
[references/compose-spec.md](references/compose-spec.md).
