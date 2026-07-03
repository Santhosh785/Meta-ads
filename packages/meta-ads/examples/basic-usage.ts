/**
 * Example usage. Run after building, or with a TS runner (tsx / ts-node).
 * The package never reads env vars itself — the caller wires configuration.
 */
import { MetaAdsConnector, MetaAuthError } from "@santhosh785/meta-ads";

async function main(): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  if (!accessToken || !adAccountId) {
    throw new Error("Set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID to run this example.");
  }

  const meta = new MetaAdsConnector({
    accessToken,
    adAccountId,
    apiVersion: "v24.0",
  });

  try {
    const identity = await meta.validateToken();
    console.log("Token OK for:", identity);

    const campaigns = await meta.getCampaigns();
    console.log(`Fetched ${campaigns.length} campaigns`);

    const insights = await meta.getInsights({
      from: "2026-07-01",
      to: "2026-07-03",
      level: "campaign",
    });
    console.log(`Fetched ${insights.length} insight rows`);
  } catch (error) {
    if (error instanceof MetaAuthError) {
      console.error("Access token is invalid or expired:", error.message);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
