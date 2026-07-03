/** Shared primitives used across the Meta Marketing API surface. */

export type MetaId = string;

/** Cursor / next-page metadata returned by Graph API "edge" responses. */
export interface Paging {
  cursors?: {
    before?: string;
    after?: string;
  };
  next?: string;
  previous?: string;
}

/** Standard shape of a Graph API list ("edge") response. */
export interface GraphListResponse<T> {
  data?: T[];
  paging?: Paging;
}

/** Inclusive date range in `YYYY-MM-DD` format. */
export interface DateRange {
  from: string;
  to: string;
}
