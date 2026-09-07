# Hosted shop and gallery editor

Production address: `https://daisyhatchet.com/editor`.

The editor is served by Netlify Functions. Its API requires a signed, eight-hour
HTTP-only session, verifies same-origin writes, and has platform rate limits.
Changing the password hash or session secret invalidates existing sessions.

## Required Netlify environment settings

Set these as secret values on the **daisyhatchet** Netlify project in the
production context only. The current plan uses all scopes; function-only scope
requires an upgrade. The application never injects these settings into browser assets. Do not commit their values or put them in netlify.toml.

- `EDITOR_PASSWORD_HASH`: random salt and scrypt hash, separated by a colon.
- `EDITOR_SESSION_SECRET`: at least 32 random bytes, hex encoded.
- `EDITOR_GITHUB_TOKEN`: a fine-grained GitHub token restricted to
  `daisyhatchet/daisyhatchet.com`, with Contents read/write and Metadata read.
  No workflow, administration, or account permissions are needed. Renew it
  before its chosen expiration date.

The temporary local password page in `tools/preview-hosted-editor.mjs` creates
the first two values in memory. The plaintext password is not saved or logged.
The local review server is not deployed and never publishes to GitHub.

## Publishing behavior

The hosted editor reads the latest data directly from GitHub main. A publish
uses the current main tree as its base and changes only the selected JSON file
and any newly uploaded photos referenced by it. It never publishes this
computer's checkout or another editor's unsaved data. If data changed since it
was loaded, or main advances during a publish, the request fails without
forcing a branch update.

Images are resized in the browser, normalized by the photo function, and held
in the browser until publishing. No upload alone makes a GitHub commit. Closing
the tab discards unpublished uploads. JPEG, PNG, and WebP are supported; device
formats the browser cannot decode must be exported as JPEG first. Use smaller
batches if uploads exceed the request limit.

GitHub accepts the commit before Netlify finishes rebuilding. The UI therefore
says the update was sent to Netlify, not that the new site is already live.

## Local checks

- `node --test tests/hosted-editor.test.mjs`
- `pnpm build`
- `node tools/preview-hosted-editor.mjs` for local review on port 4323.

After publishing the implementation, verify the live login page, unauthorized
API rejection, sign-in, read access, image processing, and the login rate-limit
entry in the Netlify deploy log. Check that function environment values are
not available to Deploy Previews. The production site remains public; only the
editor and its writing endpoints require the shared admin password.
