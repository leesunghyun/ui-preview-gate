# Security Policy

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/leesunghyun/ui-preview-gate/security/advisories/new).
Do not open a public issue for a vulnerability.

Include where it lives (file path or skill section), steps to reproduce, and the
impact you expect. You can expect an acknowledgement within 7 days.

## Scope notes

- The skill uses no credentials, API keys, or tokens.
- `scripts/capture.mjs` opens the URL you pass with a local headless browser and
  writes a screenshot. Only point it at pages you are allowed to capture.
- `scripts/compose.mjs` reads local images and a JSON spec and writes a PNG.
  Neither script sends data anywhere.
