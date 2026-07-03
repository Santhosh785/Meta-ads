# @santhosh785/meta-ads

A reusable, **fetch-only** connector for the Meta (Facebook) Marketing API.

It authenticates, calls the Graph API, handles pagination and retries, and
returns **normalized data**. That's it.

It does **not**: touch a database, use Prisma, know about tenants, read
environment variables, or contain any business/CRM logic. The caller owns all
of that.

## Install

```bash
npm install @santhosh785/meta-ads
```

Requires Node.js 18+ (uses the built-in global `fetch`; zero runtime dependencies).

## Usage

```ts
import { MetaAdsConnector } from "@santhosh785/meta-ads";

const meta = new MetaAdsConnector({
  accessToken,
  adAccountId,          // with or without the "act_" prefix
  apiVersion: "v24.0",  // optional
});

await meta.validateToken();
await meta.getCampaigns();
await meta.getAdsets();               // or { campaignId }
await meta.getAds();                  // or { campaignId } / { adsetId }
await meta.getCreatives();
await meta.getInsights({ from: "2026-07-01", to: "2026-07-03", level: "campaign" });
await meta.getLeads(formId);
await meta.getLeadForms(pageId);
```

## Configuration

| Option        | Required | Default                        | Description                        |
| ------------- | -------- | ------------------------------ | ---------------------------------- |
| `accessToken` | yes      | —                              | Meta access token                  |
| `adAccountId` | yes      | —                              | Ad account id (`act_` auto-added)  |
| `apiVersion`  | no       | `v24.0`                        | Graph API version                  |
| `baseUrl`     | no       | `https://graph.facebook.com`   | Override for testing               |
| `maxRetries`  | no       | `3`                            | Retry attempts for transient fails |
| `timeoutMs`   | no       | `30000`                        | Per-request timeout                |

## Pagination

Every list method automatically follows `paging.next` and returns the full set.
Callers never handle Meta pagination manually.

## Retry strategy

Automatically retried with exponential backoff + jitter:

- HTTP 429 (rate limiting)
- Transient 5xx server errors
- Network errors / timeouts

Never retried (fail fast):

- Invalid/expired token → `MetaAuthError`
- Missing permission → `MetaPermissionError`
- Invalid request → `MetaValidationError`

All errors extend `MetaError` and expose `httpStatus`, `code`, `subcode`,
`type`, `fbtraceId`, and `retryable`.

## Using it in a backend

The package only fetches — persistence is the caller's job:

```ts
const campaigns = await meta.getCampaigns();
for (const campaign of campaigns) {
  await prisma.metaCampaign.upsert(/* ... */);
}
```

## Build

```bash
npm run build      # emits dist/ (ESM + .d.ts)
npm run typecheck  # type-check only
```

## Philosophy

**Fetch only.** Communicate with Meta, return clean data. Everything else
belongs in the application using the package.
