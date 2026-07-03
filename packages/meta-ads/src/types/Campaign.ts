/** Normalized Meta campaign. */
export interface Campaign {
  id: string;
  name: string;
  objective: string | null;
  status: string;
  effectiveStatus: string | null;
  /** Daily budget in the account currency's minor units (e.g. cents). */
  dailyBudget: number | null;
  /** Lifetime budget in the account currency's minor units (e.g. cents). */
  lifetimeBudget: number | null;
  createdTime: string | null;
  updatedTime: string | null;
}
