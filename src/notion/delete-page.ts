import { notion } from "../utils/config";

export const deletePage = (pageId: string) =>
  notion.pages.update({ page_id: pageId, in_trash: true });
