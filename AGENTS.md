# Daisy Hatchet website safeguards

This website is maintained conversationally by a nontechnical owner. Explain choices in plain language and preserve an easy review path.

## Publishing and hosting

- While the Site has no custom production domain and remains private, a private preview deployment may be created when it materially helps review. Tell the user clearly that it is a cloud-hosted private deployment.
- Once `daisyhatchet.com`, `www.daisyhatchet.com`, or any other production domain is connected—or once the Site is public—never deploy or publish a version unless the user explicitly asks to **publish to production** in the current conversation.
- In that production state, a request to build, edit, revise, preview, test, save, finish, or make the site ready does not authorize deployment.
- Default production iteration flow: make the requested changes, run local checks, and open a local preview for review.
- If the user asks for a saved version, save it without deploying it unless they also explicitly request production publication.
- Before any deployment that affects a public Site or production domain, state which saved version will replace the live site and which audience/domain will be affected.
- Never add, remove, or change a custom domain or DNS records without a separate explicit request.
- Never change the Site's audience or sharing settings without a separate explicit request.
- Keep the existing production deployment unchanged while preview work is in progress.

## Communication

- Avoid assuming the user knows Astro, Git, DNS, deployments, or hosting terminology.
- Describe the visible result first. Explain technical details only when they help the user make a decision.
