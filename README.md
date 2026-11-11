# Transekur Driver Notice

A standalone practical test for the “driver 10 minutes away” workflow. Use fictional data. Client delivery is simulated on screen.

## Run locally

Use Node.js 24 and npm. Copy `.env.example` to `.env.local` and set the URL and publishable key of the Supabase demo project. For a new project, complete the one-time setup below.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` and choose an account on the sign-in screen to fill its credentials.

| Role | Account | Email |
| --- | --- | --- |
| Dispatch | Alex Morgan | `dispatch@example.com` |
| Driver | Carlos Rivera | `carlos@example.com` |
| Driver | Lucía Santos | `lucia@example.com` |

The password for all three demo accounts is `ArrivalDemo10!`.

## Set up a Supabase demo project

From this repository, sign in to Supabase CLI and link the exact demo project ref before applying the migration. Replace `DEMO_PROJECT_REF` with the project ref from your `.env.local` URL.

```sh
npx supabase@latest login
npx supabase@latest --workdir . link DEMO_PROJECT_REF
npx supabase@latest --workdir . db push --remote
```

For the one-time account setup, set the project's secret key as `SUPABASE_SECRET_KEY` in your terminal environment and run:

```sh
node --env-file=.env.local scripts/seed-demo.mjs DEMO_PROJECT_REF
```

The seed creates confirmed fictional users through the Auth Admin API, links their demo roles, and leaves existing passwords intact. Only the seed requires a secret key. Keep it out of the app environment, source code, and deployment.

## Try the workflow

1. Sign in as Dispatch, create a service for today in Santo Domingo and assign it to Carlos. **Client notice language** defaults to Spanish.
2. Select **Open client portal** to open the inbox in a separate tab. It waits for the arrival notice.
3. In Dispatch, tap **Demo**, select the pickup, then tap **Driver**. Tap **10 min away** on the highlighted pickup.
4. Switch to the open client portal to see the arrival banner and the stored message with Carlos’s name and vehicle. The driver’s **Demo** menu also opens the same client portal.
5. Open the floating chat button in both views to send a client message and reply as Carlos.
6. In the demo menu, choose **Back to Dispatch** and confirm the prefilled sign-in. The service should show **Sent to inbox** and its timestamp.
7. Repeat with **English** selected in Dispatch to verify the English message. Sign in as Lucía to verify that Carlos’s pickup and chat are inaccessible to her.

## Hosting

Configure the two variables from `.env.example` in Vercel to use the same Supabase demo project. Apply the migrations before deploying the client portal. Row-level policies restrict driver access. Anyone holding a client link can read the notice and participate in the chat for that service, so share it only with the intended recipient.

You can deploy directly from this folder with Vercel CLI. Sign in, link or create the demo project, and add the two Supabase variables to the Production environment before deploying:

```sh
npx --yes vercel@latest login
npx --yes vercel@latest link
npx --yes vercel@latest deploy --prod
```

## Checks

```sh
npm run lint
npm run build
npm run typecheck
```

## AI tools

OpenAI Codex assisted with the initial setup, local prototype, UI implementation, and verification.
