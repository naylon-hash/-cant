# $CANT Site

Share your CANT, get a CAN. Local wall with voting + X share links.

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Configure the X Community link

Add to `.env.local` (already created):
```env
NEXT_PUBLIC_COMMUNITY_URL=https://x.com/i/communities/1972229235319197729
```

You can also override at runtime by adding a meta tag in `src/app/layout.tsx`
or a `?community=https://...` query string while testing.

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. In Vercel → New Project → Import the repo (Next.js auto-detected).
3. Add env var `NEXT_PUBLIC_COMMUNITY_URL` in Project Settings.
4. Deploy.


## Make the Wall Global (Vercel KV)
1. In Vercel → **Storage** → **KV** → Create a KV. Attach it to this project.
2. In **Project Settings → Environment Variables**, you should now have:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Redeploy.

API routes added:
- `GET/POST /api/wall`
- `POST /api/vote`

The UI will show **(global)** if the API is reachable; otherwise it falls back to **(local)**.
