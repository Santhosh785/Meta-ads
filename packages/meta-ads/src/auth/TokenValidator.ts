import type { MetaClient } from "../client/MetaClient.js";

export interface TokenInfo {
  id: string;
  name: string | null;
}

/**
 * Lightweight token check. Performs a cheap `/me` call; a valid token
 * resolves with the identity, an invalid one throws a `MetaAuthError`.
 */
export class TokenValidator {
  constructor(private readonly client: MetaClient) {}

  async validate(): Promise<TokenInfo> {
    const me = await this.client.get<{ id: string; name?: string }>("/me", {
      fields: "id,name",
    });
    return { id: me.id, name: me.name ?? null };
  }
}
