# Handover / Deployment Notes

Quick reference for deploying this project or taking it over. Read this before
touching Vercel env vars or the Sanity webhook config.

## Infrastructure ownership — full independent transfer to the client (decided 2026-09-13)

`docs/Amegah.Com Brief.pdf` §9 ("Website Ownership") is explicit: *"All
final website assets should belong to the client... including custom
code, website files"* and *"structured in a way that removes dependence
on the designer."* That rules out an agency-hosts-forever arrangement —
the client needs to end up with his own independent Vercel, Sanity, and
Mux accounts, not access into the developer's.

**Chosen approach: a fresh rebuild under the client's own accounts,
rather than transferring the existing Vercel/Sanity projects.** A real
Vercel "Transfer Project" would carry legacy history and keep the
developer as the account that originally provisioned everything; a
from-scratch setup under the client's own logins is cleaner and, as of
2026-09-13, cheap to do — **0 real projects have been uploaded** (verified
live: only the 10 seed placeholders exist), so there's no real video/photo
content to migrate. This is the easiest point in the project's life to do
this; it only gets harder once he's uploaded real Mux video assets.

### What needs to happen, in order

1. **Client creates his own accounts** — a Vercel account and a Sanity
   account. Only he can do this (his own login/email).
2. **GitHub**: transfer the `murvyn/amegah` repo to an account/org he
   owns (or he forks/re-hosts it) — the brief's "custom code" ownership
   line means the repo itself should end up his, not just the deployed
   site.
3. **Vercel**: import the repo into a new project under his account.
   Framework preset is Next.js, no special build config beyond what's
   already in `next.config.ts`/`vercel.json` (if any).
4. **Sanity**: he creates a new project in his own org. Export the
   current dataset (`sanity dataset export production`) **after** running
   `npm run seed:placeholders -- --clear` (see below in this file) so the
   export is clean — no placeholder projects, no fake clients/partners —
   then import it into his new project's dataset
   (`sanity dataset import <file> production`). This carries over the
   real bio/phone/email/Instagram/clients/partners already entered, plus
   the taxonomy (disciplines/categories), without re-typing any of it.
5. **Mux**: add the Mux integration fresh via the Vercel Marketplace on
   his new Vercel project — this provisions a new Mux account under him,
   billed to his own payment method. No migration needed since no real
   video exists yet. Redo the one-time credential entry in Studio (paste
   the new `MUX_TOKEN_ID`/`MUX_TOKEN_SECRET` into the Video field's setup
   screen) — see the Mux section below.
6. **Domain**: `amegah.co` was bought through Vercel's own registrar under
   the developer's account. Vercel supports moving a Vercel-registered
   domain to another Vercel account/team — do this rather than
   re-purchasing. Once moved, re-verify it's attached to his new project.
7. **Environment variables**: re-set all of them (see the table below) in
   his new Vercel project, using his new Sanity project ID/dataset, his
   new Mux tokens, and a freshly generated `SANITY_REVALIDATE_SECRET`.
8. **Sanity webhook**: recreate it from scratch in his Sanity project
   pointing at his new Vercel deployment's `/api/revalidate` — see the
   "Sanity webhook setup" section below for the exact config, including
   the GROQ projection (**must be pasted by hand into the CodeMirror
   field, not scripted** — see the gotcha documented there) and the
   redeploy-after-adding-the-secret gotcha.
9. **Verify end-to-end** before considering this done: publish a real
   edit in his Studio, confirm the webhook fires (200 in his Vercel
   project's runtime logs), and confirm his live site picks it up.

Until all of this is done, the developer's accounts remain the
production environment — don't tear down the current Vercel/Sanity/Mux
setup until the new one is verified working end-to-end.

## Required environment variables

| Variable | Used by | Vercel environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client (app + Studio) | Development, Preview, **Production** |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client (app + Studio) | Development, Preview, **Production** |
| `SANITY_API_READ_TOKEN` | Server-side Sanity fetches (`sanity/lib/client.ts`) | Development, Preview, **Production** |
| `SANITY_API_WRITE_TOKEN` | `scripts/seed.ts` / `scripts/seed-placeholders.ts` only — not read at runtime | Local only (via `.env.local`); **removed from Vercel on 2026-09-11** after Vercel's dashboard flagged it as a plaintext write-capable credential sitting unused in Production/Preview/Development — nothing deployed ever read it |
| `SANITY_REVALIDATE_SECRET` | `/api/revalidate` webhook handler | Development, Preview, **Production** — must match the secret configured on the Sanity webhook |
| `MUX_TOKEN_ID` | Mux API access token id (provisioned by the Vercel Mux integration) | Development, Preview, **Production** |
| `MUX_TOKEN_SECRET` | Mux API secret key | Development, Preview, **Production** |

**`SANITY_API_READ_TOKEN` is load-bearing in production.** It's what lets
`getDisciplines()` / `getSiteSettings()` (used in the root layout for nav and
footer) actually return data. Sanity's Vercel integration commonly sets tokens
for the Development environment only by default — if `SANITY_API_READ_TOKEN`
isn't also checked for Preview and Production in Vercel's project settings,
those environments will render with an empty nav and no footer contact info
(the site won't crash — `app/layout.tsx` now catches fetch failures and falls
back to `[]` / `null` — but it will look broken). Verify all three
environments have it set before shipping.

The codebase also references `SANITY_API_DATASET`, `SANITY_API_PROJECT_ID`,
`SANITY_STUDIO_DATASET`, and `SANITY_STUDIO_PROJECT_ID` locally (see
`.env.local`) — these are Sanity CLI/Studio conventions layered on top of the
two `NEXT_PUBLIC_*` values above and aren't separately required by the
Next.js app at runtime.

## Mux video setup (partly done — one step remains)

Video is uploaded by the client inside Sanity Studio, using
`sanity-plugin-mux-input`, and played back with `@mux/mux-player-react`. Mux
is already provisioned: the Vercel Marketplace resource `mux-charcoal-crystal`
is connected to the `amegah` project, and `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`
are already in the environment.

**Outstanding: the one-time credential entry in Studio.** The plugin does not
read credentials from environment variables. The first time the Video field on
a Project is opened, Studio shows a setup screen asking for the Mux Access
Token ID and Secret Key — paste the values of `MUX_TOKEN_ID` and
`MUX_TOKEN_SECRET`. They are then stored in the dataset and shared by all
editors, so this is done once, by a person, and never again. If the token is
rejected, check in the Mux dashboard that it has read+write on Video and read
on Data.

Until this is done, the Video field shows "Configure API" instead of an upload
dropzone, and no video can be uploaded or played.

**Why the dataset must stay private.** The plugin stores those credentials as
plaintext fields on an ordinary dataset document (`_id: secrets.mux`). The
Sanity project id is public — it ships in the browser bundle as
`NEXT_PUBLIC_SANITY_PROJECT_ID` — so if the dataset's visibility were ever
switched to public, anyone could read the Mux credentials and create or delete
assets on the client's Mux account. The dataset is currently **private**
(verified: an unauthenticated API query returns no documents, while an
authenticated one returns them). Do not make it public.

**Billing.** Mux's free tier (100k streaming minutes/month) covers a portfolio
comfortably. The client inherits this account at handover, so the encoding tier
configured in `sanity.config.ts`'s `muxInput()` is their cost to carry.

## Sanity webhook setup — done (2026-09-11)

The revalidate endpoint (`app/api/revalidate/route.ts`) is live and wired up.
Configured as:

1. `sanity.io/manage` → project → **API** → **Webhooks** → webhook named
   **"Vercel revalidate"** (id `L0mrgY2hMPIYetvy`), pointed at
   `https://amegah.vercel.app/api/revalidate`, dataset `production`.
2. Its secret matches `SANITY_REVALIDATE_SECRET`, set in all three Vercel
   environments (Production, Preview, Development) and pulled into
   `.env.local`.
3. Triggers on **create**, **update**, and **delete**.
4. **The GROQ projection is set** so `_type` resolves even on delete events —
   see below for why this matters. Current value:

   ```groq
   {
     "_id": _id,
     "_type": select(defined(after()) => after()._type, before()._type)
   }
   ```

Verified end-to-end: patched a field directly in the dataset, confirmed the
webhook logged a `200` in Vercel's runtime logs, and confirmed the live site
picked up the change within ~10 seconds with no manual cache action.

**Why the projection matters.** Sanity's default projection is built from the
document itself, and a deleted document has no "after" state — so a naive
`{_id, _type}` projection can come back with `_type` missing on delete
payloads. This project's `app/api/revalidate/tags.ts` (`tagsForPayload`) keys
entirely off `_type` to decide which cache tag to revalidate, so a missing
`_type` means **deleted content silently never gets revalidated** — stale
content stays cached indefinitely. The Delta-GROQ `before()`/`after()`
functions above pull `_type` from whichever side of the change still has it.

**Two gotchas hit while setting this up, worth knowing if it ever needs
re-doing:**

- **A newly-added Vercel env var doesn't apply to the deployment that's
  already running.** `vercel env add` (or the dashboard) only bakes the value
  into the *next* deployment. Adding `SANITY_REVALIDATE_SECRET` without
  redeploying left the currently-live deployment still seeing it as unset, so
  the webhook got a `500` ("Revalidation secret is not configured") every
  time it fired. Fixed with `vercel redeploy <deployment-id> --target
  production` after adding the var — no code change needed, just a fresh
  deployment.
- **The Projection field in Sanity's webhook editor is a CodeMirror editor,
  not a plain textbox.** Scripted/programmatic edits to the underlying
  `<textarea>` don't stick — Sanity's UI reads from its own editor state on
  save, not the raw DOM value, so a script-set value silently reverts on
  reload. It has to be typed/pasted by actually clicking into the rendered
  box in a browser.

If this webhook is ever recreated (e.g. new project, new environment), redo
all of the above — a webhook with the URL/secret/triggers but no projection
will work for everyday edits but silently fail to invalidate on deletes.

## A local build can serve stale CMS content

CMS reads are cached with `cacheLife('max')` and invalidated on demand by the
Sanity webhook (see above). Next.js persists that cache in `.next/cache`
**between builds**, so locally — where the webhook isn't wired up — a build can
keep serving whatever it cached earlier, indefinitely.

This is not theoretical: during Phase 4 a build made before the Site Settings
document existed cached the `null`, and every later build reused it, producing
a homepage with no hero and no name. The content was published and correct the
whole time.

If a local build shows content you know is out of date, or shows nothing where
content exists:

```bash
rm -rf .next && npm run build
```

Production is unaffected — the webhook invalidates the relevant tags on publish.

## Running the seed script

`npm run seed` (`scripts/seed.ts`) is idempotent — it uses deterministic
document IDs (`discipline.<slug>`, `category.<discipline-slug>.<slug>`) and
Sanity's `createOrReplace`, so re-running it won't create duplicates.

**However, it is destructive to any client edits on those specific
documents.** It will overwrite the title, slug, cadence, and `orderRank` of
the 3 seeded disciplines and 16 seeded categories from the client brief —
including any drag-reordering a client has done in the Studio. Only re-run it
intentionally (e.g. to fix a data problem), never as a routine step in a
deploy pipeline.

## Placeholder content

`npm run seed:placeholders` (`scripts/seed-placeholders.ts`) fills an empty
dataset with invented projects, stock photographs from Picsum, and Mux's
public demo videos, so the site can be seen and reviewed before the client has
uploaded anything.

**All of it must be removed before launch** — the brief is explicit that the
client owns all assets, and none of this is theirs:

```
npm run seed:placeholders -- --clear
```

`--clear` deletes every document it created (they all carry a `placeholder.`
ID prefix) and unsets the fields it set on the Site Settings singleton and on
the three discipline documents, leaving anything the client has since added
untouched.

Two things worth knowing:

- **`npm run seed` will wipe the discipline cover images.** The taxonomy seed
  uses `createOrReplace` on the discipline documents, so re-running it drops
  the `coverImage` and `description` the placeholder script sets on them —
  the homepage triptych goes back to three empty boxes. Re-run
  `seed:placeholders` afterwards if that happens.
- **The demo videos are chosen, not arbitrary.** Mux's best-known demo ID is a
  recorded conference talk full of white slides, which looks broken behind the
  white wordmark. If a demo ID ever stops streaming, check a replacement's
  thumbnail at `https://image.mux.com/<id>/thumbnail.jpg` and pick something
  dark — the script fails loudly rather than seeding a broken player.

Note that `discipline.coverImage` is a real schema field the client can set in
the Studio, but nothing populates it by default. Without it — placeholder or
real — the homepage triptych renders three empty bordered boxes. Worth walking
the client through when handing over.
