import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";
import { todoist } from "../utils/config.ts";
import { deletePage } from "../notion/delete-page.ts";
import { getProperty } from "../notion/get-property.ts";

export const performDelete = async (
  notionPage: PageObjectResponse,
  event: TodoistEventItem,
) => {
  const toDelete = event?.is_deleted ? notionPage : event;

  if (toDelete === event) {
    console.debug(
      `[-] Deleting Todoist task (title=\"${event.content}\", pageId=${notionPage.id})`,
    );
    await todoist.deleteTask(event.id);
    return;
  }

  const pageTitle = getProperty(notionPage.properties, "Name", "title").title[0]
    ?.plain_text;
  console.debug(
    `[-] Deleting Notion task (title=\"${pageTitle}\", taskId=${event.id})`,
  );

  await deletePage(notionPage.id);
};
