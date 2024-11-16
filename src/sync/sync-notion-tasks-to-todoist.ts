import { getProperty } from "../notion/get-property.ts";
import { getPagesIterator } from "../notion/get-pages-iterator.ts";
import { pushNotionTask } from "./push-notion-task.ts";
import { getActivityLogEvents } from "../todoist/get-activity-log-events.ts";
import { pushTodoistTask } from "./push-todoist-task.ts";
import { performSync } from "./perform-sync.ts";
import { requiresUpdate } from "./requires-update.ts";
import { getPageByTaskId } from "../notion/get-page-by-task-id.ts";
import { performDelete } from "./perform-delete.ts";
import { requiresDelete } from "./requires-delete.ts";

export const syncNotionTasksToTodoist = async (
  databaseId: string,
  todoistSyncToken: string = "*",
  afterTimestamp?: string,
) => {
  console.log("Getting activity log events from Todoist\u2026");
  const todoistSyncResponse = await getActivityLogEvents(todoistSyncToken);
  console.log(`Got ${todoistSyncResponse.items.length} events from Todoist`);

  console.log("Syncing tasks between Notion and Todoist\u2026");

  // ---------------------------------------------------------

  console.debug("Syncing from Notion to Todoist\u2026");

  const ignoreTodoistTaskIds = new Set<string>();

  for await (const notionTask of await getPagesIterator(databaseId, {
    afterTimestamp,
    sourceIsNotEmpty: true,
  })) {
    const todoistTaskId = getProperty(
      notionTask.properties,
      "Source",
      "rich_text",
    ).rich_text[0]?.plain_text;

    if (!todoistTaskId) {
      throw new Error("Notion task does not have a 'Source' property");
    }

    console.log(`Syncing task ${todoistTaskId}`);
    ignoreTodoistTaskIds.add(todoistTaskId);

    const todoistTask = todoistSyncResponse.items.find(
      (event) => event.id === todoistTaskId,
    );

    if (todoistTask && requiresDelete(notionTask, todoistTask)) {
      await performDelete(notionTask, todoistTask);
      continue;
    }

    if (await requiresUpdate(notionTask, todoistTask)) {
      await performSync(databaseId, notionTask, todoistTaskId, todoistTask);
      continue;
    }

    console.debug(
      `[ ] Task does not require update (title=\"${todoistTask?.content}\", pageId=${notionTask.id})`,
    );
  }

  // ---------------------------------------------------------

  console.debug(
    `Syncing ${todoistSyncResponse.items.length} item(s) from Todoist to Notion\u2026`,
  );
  console.debug(`Ignoring ${ignoreTodoistTaskIds.size} tasks`);

  for (const event of todoistSyncResponse.items.filter(
    (event) => !ignoreTodoistTaskIds.has(event.id),
  )) {
    const notionPage = await getPageByTaskId(databaseId, event.id);

    if (notionPage === undefined) {
      console.debug(
        `[+] Creating Notion task (title=\"${event.content}\", taskId=${event.id})`,
      );
      await pushTodoistTask(event, databaseId);
      continue;
    }

    if (requiresDelete(notionPage, event)) {
      await performDelete(notionPage, event);
      continue;
    }

    if (await requiresUpdate(notionPage, event)) {
      await performSync(databaseId, notionPage, event.id, event);
      continue;
    }

    console.debug(
      `[ ] Task does not require update (title=\"${event.content}\", pageId=${notionPage.id})`,
    );
  }

  // ---------------------------------------------------------

  console.log("Pushing new tasks to Todoist\u2026");
  console.log("Getting new tasks from Notion\u2026");

  const createTasksResponse = await getPagesIterator(databaseId, {
    afterTimestamp,
    sourceIsNotEmpty: false,
  });

  for await (const notionTask of createTasksResponse) {
    const title = getProperty(notionTask.properties, "Name", "title").title[0]
      ?.plain_text;
    console.log(
      `[+] Creating Todoist task (title=\"${title}\", pageId=${notionTask.id})`,
    );
    await pushNotionTask(notionTask);
  }

  return todoistSyncResponse.sync_token;
};
