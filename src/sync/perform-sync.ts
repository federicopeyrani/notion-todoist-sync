import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";
import { syncTodoistTask } from "./sync-todoist-task.ts";
import { getProperty } from "../notion/get-property.ts";
import { syncNotionTask } from "./sync-notion-task.ts";
import { getSyncSource } from "./get-sync-source.ts";

export const performSync = async (
  databaseId: string,
  notionPage: PageObjectResponse,
  todoistTaskId: string,
  event?: TodoistEventItem,
) => {
  if (getSyncSource(notionPage, event) === event) {
    console.debug(
      `[~] Updating Notion task (title=\"${event.content}\",taskId=${todoistTaskId})`,
    );
    await syncTodoistTask(event, databaseId, notionPage.id);
    return;
  }

  const pageTitle = getProperty(notionPage.properties, "Name", "title").title[0]
    ?.plain_text;
  console.debug(
    `[~] Updating Todoist task (title=\"${pageTitle}\", pageId=${notionPage.id})`,
  );

  await syncNotionTask(notionPage, todoistTaskId);
};
