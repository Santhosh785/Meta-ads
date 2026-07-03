/** Normalized Meta ad creative. */
export interface Creative {
  id: string;
  name: string | null;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  videoId: string | null;
  callToActionType: string | null;
  linkUrl: string | null;
  urlTags: string | null;
}
