import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";

export const requiresDelete = (
  notionPage: PageObjectResponse,
  event: TodoistEventItem,
) => {
  const isNotionPageArchived = notionPage.archived || notionPage.in_trash;
  return event.is_deleted !== isNotionPageArchived;
};
