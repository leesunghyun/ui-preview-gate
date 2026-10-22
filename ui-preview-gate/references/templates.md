# Templates

Keep both messages short. Attach the image; do not describe what it already shows.

## Preview approval request (phase 2)

```markdown
**Change:** <one line>

![before / after](<path>/preview.png)

- **Images:** real captures | after side is a mockup (allowed by: <user/project rule>)
- **Where:** <screen / tab> - <position on screen>
- **What becomes possible:**
  - <user type>: <action they can now take>
- **Does not change:** <behaviour, screens, data that stay the same>
- **Affected surfaces:** <e.g. Web, mobile app, embedded webview> (unaffected: <...>)
- **Evidence:** `<file:line>` (current behaviour), `<file:line>` (where the change goes)
- **Pre-send check:** 1 boxes on target, no text covered / 2 same state (differences in caption) / 3 boxes paired / 4 staged screens marked / 5 one language - all OK

**Case inventory** (all cases, even those without an image yet):

| # | Case (state / screen after tap / after action / other surfaces) | What the user sees | Reused component | Image |
| --- | --- | --- | --- | --- |
| 1 | <case> | <one line> | `<file:line>` | attached / next batch (data: <how>) / out of scope: <why> |

**Proposed defaults for open decisions:** <decision> -> <proposal and reason>

Reply OK to implement exactly this. Anything else needs a new preview.
```

## Verification report (phase 4)

```markdown
**Result:** Matches the approved preview | Mismatch: <summary>

![approved / actual](<path>/verify.png)

| Promised in preview | Result |
| --- | --- |
| <change 1> | OK / differs: <how> |
| Does not change: <item> | unchanged / changed: <how> |

- **Interaction checked:** <what was clicked/typed and the outcome>
- **Pre-send check:** 1-5 as above / 6 amber boxes are tight and re-captured - all OK
- **Not verified:** <platform/device/data not checked, and why>
```
