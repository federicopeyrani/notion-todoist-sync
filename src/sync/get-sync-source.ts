import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";

export const getSyncSource = (
  notionPage: PageObjectResponse,
  event?: TodoistEventItem,
) =>
  event && new Date(notionPage.last_edited_time) < new Date(event.updated_at)
    ? event
    : notionPage;
