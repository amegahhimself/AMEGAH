# Handover / Deployment Notes

Quick reference for deploying this project or taking it over. Read this before
touching Vercel env vars or the Sanity webhook config.

## Handing over to the client — accounts still need to move (not done)

Everything below was provisioned under the developer's own personal
accounts, not the client's. This is fine during development, but **before
the client actually owns and runs this site**, ownership of these accounts
needs to move to something the client controls — otherwise the client's
live website depends on a third party's personal login indefinitely.

- **Vercel** — the project lives under the personal team
  `marvins-projects-8d710c28`. Transfer the project to a team the client
  owns (Vercel supports project transfer between accounts/teams — the
  client will need their own Vercel account first), or add the client as an
  Owner on this team if a full transfer isn't wanted yet. Whoever owns this
  team is also who Mux billing follows (see below), and who holds the
  `amegah.vercel.app` domain alias.
- **Sanity** — the project (`project-citron-flame`, id `fknc0b0k`) lives
  under the personal org "Marvin's projects". Either transfer the project to
  an organization the client owns, or add the client (or their designated
  admin) as a project member with Administrator access — the webhook
  management permission specifically requires Administrator, confirmed
  while setting up the revalidate webhook above; a lower role can't do this.
- **Mux** — not a separate signup; it's provisioned through the Vercel
  Marketplace integration attached to the Vercel project, so it moves
  automatically with the Vercel transfer. Worth explicitly confirming with
  the client that the billing method on file becomes theirs, not the
  developer's card, once transferred.
- **Domain** — not purchased yet (see `docs/costs.md`). When it is, register
  it directly under the client's own registrar account from the start,
  rather than the developer's, to avoid a second transfer later.
- **GitHub repo** — currently a private repo under the developer's personal
  account (`murvyn/amegah`), connected to Vercel's Git integration for
  auto-deploy on push. Decide with the client whether the repo itself
  transfers to an account/org they own (breaking the existing Vercel Git
  link until reconnected to the new location) or whether the developer
  keeps maintaining the codebase as an ongoing arrangement — this is a
  business decision, not a technical default.
- **API tokens/secrets** — `SANITY_API_READ_TOKEN`, `SANITY_API_WRITE_TOKEN`,
  and `SANITY_REVALIDATE_SECRET` were all generated under the developer's
  Sanity access. They keep working after an ownership transfer (Sanity
  tokens are project-scoped, not creator-scoped), but as a security
  cleanup step, consider rotating them post-handover — generate fresh
  tokens under the client's own account, update them in Vercel, and revoke
  the old ones — so the developer's personal credentials aren't sitting in
  a site they no longer operate.

## Required environment variables

| Variable | Used by | Vercel environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client (app + Studio) | Development, Preview, **Production** |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client (app + Studio) | Development, Preview, **Production** |
| `SANITY_API_READ_TOKEN` | Server-side Sanity fetches (`sanity/lib/client.ts`) | Development, Preview, **Production** |
| `SANITY_API_WRITE_TOKEN` | `scripts/seed.ts` only — not read at runtime | Local only (via `.env.local`); does not need to be set in Vercel |
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
