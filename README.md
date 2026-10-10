# OriginDuty — public website

Public product website hosted via GitHub Pages: `https://reflectme-source.github.io/originduty-site/`.

**Architecture**
- GitHub Pages: public marketing website, browser-side evidence dashboard, PL language, static files, SEO, privacy and terms.
- Railway: independent public candidate-regulation API at `https://public-pilot-production.up.railway.app/regulations.json` (official EUR-Lex OJ-L RSS + CELLAR). GET requests are CORS-enabled only for `https://reflectme-source.github.io`.
- Railway/PostgreSQL: form intake, not exposed from GitHub Pages. CTA goes to the hosted pilot form.
- Private application source: `reflectme-source/originduty`. Never store credentials, operator keys, leads, customer lists or internal API tokens in this public repository.

**Scope / honesty**
Public dashboard is an unauthenticated research viewer of public candidate documents, not a customer workspace. A document match is not a binding customs ruling. Customer dashboard, auth, individual watchlists, producer-specific interpretation, notification delivery, invoicing and Stripe LIVE have not been released. Displayed prices are only commercial hypotheses.

**Acceptance checks**
1. HTML document and assets return HTTP 200.
2. Browser GET for Railway `/regulations.json` succeeds from GitHub Pages; CORS header should permit only public origin.
3. Dashboard explicitly shows stale/partial/unavailable source states; no fabricated KPIs.
4. Enter exact `3905300091` (CN), compare `3905300099` (not same 10-digit code), verify origin CN vs IN.
5. See CELEX URL, source, applied action and source date.
6. Contact CTA goes to Railway pilot form; site does not capture PII directly.
