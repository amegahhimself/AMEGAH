# Ongoing Costs — What the Client Needs to Know

Reference for a conversation with the client about what this site actually
costs to run once it's live. Figures below are approximate — always check
each provider's current pricing page before quoting a client, since these
change.

## Open questions for the client

- [x] **`amegah.com` is already taken.** Resolved 2026-09-11 — `amegah.co`
      was registered and connected to the Vercel project instead. See
      `docs/handover.md`'s domain entry: it was bought under the developer's
      Vercel account, so ownership still needs to move to the client like
      everything else there.
- [ ] Stay on Mux for video, or switch to a cheaper/free alternative
      (YouTube, Vimeo, Cloudflare Stream — see below)?
- [ ] Launch hosting on Vercel's free tier, or go straight to the paid plan?

---

## 1. Domain registration

`amegah.com` was taken, so `amegah.co` was registered instead (via Vercel's
own registrar) and is now connected to the site. Registration is a small
annual fee (commonly $10–20/year depending on the TLD/registrar).

## 2. Hosting — Vercel

- **Free ("Hobby") tier exists and costs $0.** The site can launch on it with
  no hosting bill at all.
- **The catch:** Vercel's Hobby tier is licensed for personal, non-commercial
  use. A client-facing business site technically falls outside those terms,
  even though plenty of small sites run on it in practice without issue.
- **When the $20/month (Pro) plan becomes worth it:**
  - Wanting to be properly licensed for commercial use, not just informally
    running on a personal-use tier.
  - Traffic/bandwidth usage grows past what Hobby includes.
  - Wanting team seats (more than one person managing the Vercel project),
    better analytics, or faster support.
- **Decision available:** launch free on Hobby now and only upgrade if/when
  one of the above becomes a real issue, or start on Pro from day one for
  peace of mind. Either is a legitimate choice — this doesn't have to be
  decided before launch.

## 3. CMS — Sanity

- **Free plan** covers a set amount of API requests, asset bandwidth, and a
  couple of user seats — likely enough for one editor (the client) managing
  a portfolio site's worth of content.
- **When paying becomes necessary:** once actual usage — API requests,
  bandwidth for images/video metadata, or number of people with Studio
  access — exceeds the free plan's limits, Sanity requires moving to a paid
  plan. For a single-editor portfolio site, this is unlikely to happen soon,
  but it scales with traffic and content volume, so it's not a one-time
  decision.

## 4. Video — Mux (the real variable cost)

- **No free tier to size against.** Mux bills pay-as-you-go per minute of
  video stored/encoded and per minute actually streamed to viewers, starting
  from the first minute.
- This is the cost most likely to move around month to month, since it
  scales directly with how much video content exists and how many people
  actually watch it.
- **Condition for paying:** effectively immediate — any video uploaded and
  watched generates a bill. There's no free usage threshold to stay under.

### Alternatives to Mux, if the client wants to avoid this cost

| Option | Cost | Trade-off |
| --- | --- | --- |
| **Mux** (current setup) | Pay-per-minute, no free tier | Best playback quality — adaptive streaming, no third-party branding, already built and working |
| **YouTube embed** | Free | YouTube branding, related-video suggestions, and possibly ads shown on the client's own site; least control over the viewing experience |
| **Vimeo** | Subscription (monthly/annual, not pay-as-you-go) | Ad-free, more polished player than YouTube, but a fixed recurring cost regardless of how much it's actually watched |
| **Cloudflare Stream** | Pay-per-minute, similar model to Mux | Often somewhat cheaper than Mux for the same usage, but would require rebuilding the current video integration in the code — not a drop-in swap |
| **Self-hosted video files** | No separate video bill | No adaptive streaming — poor experience on slow connections, and shifts the bandwidth cost onto Vercel/Sanity instead of a service built for video |

For a director/cinematographer portfolio, video quality is arguably the
whole point of the site, which is why Mux was chosen — but if cost is the
priority over polish, YouTube is the free option and Vimeo is the
low-effort paid middle ground.

## Summary

| Service | Free option exists? | Pay when.... |
| --- | --- | --- |
| Domain | No — always a paid annual cost | From day one |
| Vercel hosting | Yes (Hobby) | Commercial-use compliance wanted, or traffic/team needs outgrow Hobby |
| Sanity CMS | Yes | Usage (requests/bandwidth/seats) exceeds the free plan |
| Mux video | No | Immediately, scales with video watch time |
