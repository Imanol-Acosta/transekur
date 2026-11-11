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
2. Open the service’s **Client preview** link. It will wait for the notice.
3. In another browser profile or private window, sign in as Carlos and tap **10 min away**.
4. Check that the preview shows a Spanish message with Carlos’s name and vehicle. Confirm that Dispatch shows the same message, the timestamp and **Sent — simulated**.
5. Reload the driver view. The recorded notice should remain visible and the send button should be gone.
6. Repeat with a new service and select **English** in Dispatch. Check that both views show the English message.
7. Sign in as Lucía in a separate session to verify that Carlos’s services do not appear in her schedule.

## Hosting

Configure the two variables from `.env.example` in Vercel to use the same Supabase demo project. Authentication and storage run in Supabase. Row-level policies restrict driver access, and the client preview uses a token to read one notice.

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
