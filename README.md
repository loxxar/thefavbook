# thefavbook

Take back control of your browser bookmarks.

Drop in the HTML files exported by Chrome, Firefox, Safari, Edge or Brave. They
get merged, sorted with the help of a language model, and exported back to a
file any browser can re-import.

Your browser stays home. Nothing to migrate, no new tool to adopt.

**Live:** https://thefavbook.nodev.tn

---

## The problem

Bookmarks pile up across browsers for years. Duplicates everywhere, dead links,
folders that stopped meaning anything. Showing them in a tree solves nothing —
the real obstacle is **processing a few thousand entries without losing a
weekend to it**.

## What it does today

- **Multi-file import.** Netscape bookmark format parsing, folders with the
  same name merged, nothing dropped.
- **Assisted sorting.** Five criteria to choose from — by topic, by resource
  type, by service, by intent, or minimal. The model proposes, you decide:
  nothing moves without approval.
- **Manual drag and drop.** Automatic sorting is never right everywhere, so
  corrections must not require a full re-analysis.
- **Inline preview.** Tree on the left, selected bookmark on the right, with the
  page's own sharing metadata. No tab switching.
- **Netscape export.** A file that re-imports anywhere, available at any time.

## Not built yet

- Canonical de-duplication — URL normalisation already exists, nothing consumes
  it yet
- Dead link checking
- Separate spaces (work, personal, …)
- Interface in languages other than French

---

## Design decisions worth knowing

**The parser does not trust the HTML.** The Netscape format leaves `<DT>`,
`<DD>` and `<p>` unclosed, and every HTML parser rebuilds a different hierarchy
from it. So the file is walked as an event stream with a `<DL>` stack, and the
reconstructed tree is ignored.

**Original URLs are never rewritten.** Normalisation exists for de-duplication
and is stored next to the original, never in place of it.

**Nothing reaches a third party without explicit consent.** Sorting sends
titles and URLs only, never page content. See
[the privacy page](https://thefavbook.nodev.tn/confidentialite).

**Sorting is proposed, never applied.** Suggestions land in their own table and
wait. A run over several thousand bookmarks that cannot be reviewed is a run
that cannot be corrected.

**The preview reads sharing metadata, not screenshots.** A headless browser
would need three to five seconds and a few hundred kilobytes per page — hours
and close to a gigabyte for a full collection — and would return a login form
for everything behind authentication.

---

## Run it yourself

The project is open source under the MIT licence. Fork it, self-host it, take
what you need.

### Requirements

- Node.js 24 (an `.nvmrc` is provided)
- pnpm
- A PostgreSQL database — [Neon](https://neon.com) works well, its free tier
  resumes on its own after idling
- An [OpenRouter](https://openrouter.ai) key, only if you want the sorting

### Setup

```bash
git clone https://github.com/loxxar/thefavbook.git
cd thefavbook
pnpm install
cp .env.example .env    # then fill it in
pnpm db:migrate
pnpm dev
```

Everything except the sorting works without an OpenRouter key.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Pooled connection, used at runtime |
| `DIRECT_URL` | yes | Unpooled connection, used by migrations |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Public URL of the instance |
| `OPENROUTER_API_KEY` | no | Enables assisted sorting |
| `OPENROUTER_MODEL` | no | Defaults to `google/gemini-2.5-flash-lite` |
| `NEXT_PUBLIC_TIP_URL` | no | Shows a support link after an export |
| `KOFI_VERIFICATION_TOKEN` | no | Verifies the Ko-fi webhook |

### Deploying

Built for Vercel, but nothing ties it there. Set the build command to:

```
prisma generate && prisma migrate deploy && next build
```

`prisma generate` matters: the client is emitted to `src/generated/prisma`,
outside `node_modules`, so it is absent from the build cache. Without that step
a cached deploy fails on a missing module.

---

## Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma 7 (`pg` driver adapter) |
| Auth | Better Auth |
| Sorting | OpenRouter |
| Tests | Vitest |

## Scripts

| Command | Effect |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm test` | Vitest suite |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Apply migrations in development |
| `pnpm db:studio` | Prisma Studio |

## Repository documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — structure and constraints
- [DECISIONS.md](DECISIONS.md) — decision log, with the reasoning behind each
- [CONVENTIONS.md](CONVENTIONS.md) — code conventions

These are written in French, as are the interface and the code comments.
Translating them is on the list.

## Contributing

Issues and pull requests are welcome. The decision log is the place to start:
it explains why things are the way they are, which is usually what a diff
cannot say.

## Licence

MIT — see [LICENSE](LICENSE).

## A note on the look

thefavbook is not affiliated with, or endorsed by, Apple. Its appearance is a
tribute to Mac OS X. Trademarks belong to their respective owners.
