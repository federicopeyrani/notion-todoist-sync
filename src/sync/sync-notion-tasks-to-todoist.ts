import { notion } from "../utils/config.ts";
import { getProperty } from "../notion/get-property.ts";
import { getPagesIterator } from "../notion/get-pages-iterator.ts";
import { pushNotionTask } from "./push-notion-task.ts";
import { getActivityLogEvents } from "../todoist/get-activity-log-events.ts";
import { pushTodoistTask } from "./push-todoist-task.ts";
import { isFullPage } from "@notionhq/client";
import { performSync } from "./perform-sync.ts";
import { requiresUpdate } from "./requires-update.ts";

export const syncNotionTasksToTodoist = async (
  databaseId: string,
  todoistSyncToken: string = "*",
  afterTimestamp?: string,
) => {
  console.log("Getting activity log events from Todoist");
  const todoistSyncResponse = await getActivityLogEvents(todoistSyncToken);
  console.log(`Got ${todoistSyncResponse.items.length} events from Todoist`);

  console.log("Getting tasks from Notion");
  const syncTasksResponse = await getPagesIterator(databaseId, {
    afterTimestamp,
    sourceIsNotEmpty: true,
  });

  console.log("Syncing tasks between Notion and Todoist");

  // ---------------------------------------------------------

  console.debug("Syncing from Notion to Todoist");

  const ignoreTodoistTaskIds = new Set<string>();

  for await (const notionTask of syncTasksResponse) {
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

    if (!(await requiresUpdate(notionTask, todoistTask))) {
      console.debug(
        `Task does not require update (title=\"${todoistTask?.content}\", pageId=${notionTask.id})`,
      );
      continue;
    }

    await performSync(databaseId, notionTask, todoistTaskId, todoistTask);
  }

  // ---------------------------------------------------------

  console.debug(
    `Syncing ${todoistSyncResponse.items.length} item(s) from Todoist to Notion`,
  );
  console.debug(`Ignoring ${ignoreTodoistTaskIds.size} tasks`);

  for (const event of todoistSyncResponse.items.filter(
    (event) => !ignoreTodoistTaskIds.has(event.id),
  )) {
    const databaseQueryResponse = await notion.databases.query({
      database_id: databaseId,
      filter: { property: "Source", rich_text: { equals: event.id } },
      page_size: 1,
    });

    const notionPage = databaseQueryResponse.results[0];

    if (notionPage === undefined) {
      console.debug(
        `[+] Creating Notion task (title=\"${event.content}\", taskId=${event.id})`,
      );
      await pushTodoistTask(event, databaseId);
      continue;
    }

    if (!isFullPage(notionPage)) {
      throw new Error("Notion page is not a full page");
    }

    if (!(await requiresUpdate(notionPage, event))) {
      console.debug(
        `[ ] Task does not require update (title=\"${event.content}\", pageId=${notionPage.id})`,
      );
      continue;
    }

    await performSync(databaseId, notionPage, event.id, event);
  }

  // ---------------------------------------------------------

  console.log("Pushing new tasks to Todoist");
  console.log("Getting new tasks from Notion");

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
