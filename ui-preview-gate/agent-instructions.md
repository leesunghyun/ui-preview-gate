<!-- ui-preview-gate:start -->
## UI changes (ui-preview-gate)

- In every turn - including follow-up turns and conversations that started as
  support, research, review, debugging, or an audit - if you suggest, give an
  opinion on, design, or implement a change users can see (screen, tab, button,
  field, layout, copy, feature), read and follow the `ui-preview-gate` skill in
  that turn, even if the user did not name it. Keep following it until the
  change is verified.
- A bug fix that makes users see a different screen, dialog, or message (for
  example an error sheet replaced by another sheet) is a UI change. Get approval
  on the before/after image first.
- This includes "is it possible?" answers and assessments whose recommendation
  changes what users see, and surfaces outside the app: LINE or other chat
  messages and cards (e.g. Flex), push notifications, emails, and browser
  extension popups.
- Do not answer a UI proposal with prose or a case table alone. Include the
  before/after image in the same reply, or say why it cannot be made yet and when
  it will be.
- Never ask for a go-ahead, or for a pick between options, on a UI change before
  its before/after image is in the same reply. If making the image needs a step
  that itself needs approval (e.g. a test send), ask only for that step, and ask
  about the change itself later, with the image.
- While a UI change is awaiting approval or in progress, progress reports,
  option lists, and questions about it also re-attach its before/after image.
  Never describe the changed screen in prose alone.
- Show images inline in the chat (e.g. Markdown `![](/absolute/path.png)`), not
  as a bare file path. For tall captures, also embed a crop of the changed region.
<!-- ui-preview-gate:end -->
