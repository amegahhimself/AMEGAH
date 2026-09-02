# Handover / Deployment Notes

Quick reference for deploying this project or taking it over. Read this before
touching Vercel env vars or the Sanity webhook config.

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

## Sanity webhook setup (not yet done — required before launch)

The revalidate endpoint (`app/api/revalidate/route.ts`) exists but no webhook
currently calls it. Set one up:

1. Go to `sanity.io/manage` → your project → **API** → **Webhooks**.
2. Create a webhook pointed at `https://<production-domain>/api/revalidate`.
3. Set its secret to the same value as `SANITY_REVALIDATE_SECRET` in Vercel.
4. Trigger on **create**, **update**, and **delete**.
5. **Set the GROQ projection so `_type` is present even on delete events.**
   Sanity's default projection is built from the document itself, and a
   deleted document has no "after" state — so a naive `{_id, _type}`
   projection can come back with `_type` missing on delete payloads. This
   project's `app/api/revalidate/tags.ts` (`tagsForPayload`) keys entirely off
   `_type` to decide which cache tag to revalidate, so a missing `_type` means
   **deleted content silently never gets revalidated** — stale content stays
   cached indefinitely.

   Use Sanity's Delta-GROQ `before()` / `after()` functions in the
   projection to pull `_type` from whichever side of the change still has it,
   e.g.:

   ```groq
   {
     "_id": _id,
     "_type": select(defined(after()) => after()._type, before()._type)
   }
   ```

   (Verify exact syntax against the current Sanity webhook projection editor
   when you set this up — Delta-GROQ is documented at
   sanity.io/docs/developer-guides/projections-in-groq-powered-webhooks — the
   important thing is that `_type` must resolve on delete, not the exact
   expression above.)

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
