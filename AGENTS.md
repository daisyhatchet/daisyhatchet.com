# Daisy Hatchet website safeguards

This website is maintained conversationally by a nontechnical owner. Explain choices in plain language and preserve an easy review path.

## Publishing and hosting

- Production hosting is now Netlify for `daisyhatchet.com`. Netlify automatically publishes from the GitHub repository's `main` branch (`https://github.com/daisyhatchet/daisyhatchet.com.git`).
- When the owner says "publish", "publish it", or "publish to production", they mean commit the reviewed changes and push to GitHub `main`, triggering Netlify publication. This is explicit production authorization; do not ask for a second confirmation.
- Do not publish through OpenAI Sites, push to its source repository, or obtain Sites Git credentials. The existing `.openai/hosting.json` is legacy metadata, not the current publishing destination.
- If publication fails or does not appear, diagnose the GitHub trigger and Netlify deployment using available tools and logs. Do not switch hosting providers or change domains as a workaround.
- Command-line Git is authenticated through GitHub CLI as `daisyhatchet`. The CLI is installed at `/Users/admin/.local/bin/gh`, and `gh auth setup-git` configures Git to use it. Prefer command-line Git for publishing; computer use and GitHub Desktop are not required. If authentication fails, check CLI authentication before asking the owner to sign in again. Never request or expose a token.
- A request to build, edit, revise, preview, test, save, finish, or make the site ready does not authorize pushing to `main` or deploying.
- Default production iteration flow: make the requested changes, run local checks, and open a local preview for review.
- If the user asks for a saved version, save it without deploying it unless they also explicitly request production publication.
- Before any deployment that affects a public Site or production domain, state which saved version will replace the live site and which audience/domain will be affected.
- Never add, remove, or change a custom domain or DNS records without a separate explicit request.
- Never change the Site's audience or sharing settings without a separate explicit request.
- Keep the existing production deployment unchanged while preview work is in progress.

## Communication

- Avoid assuming the user knows Astro, Git, DNS, deployments, or hosting terminology.
- Describe the visible result first. Explain technical details only when they help the user make a decision.
