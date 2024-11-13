import { notion, todoist } from "./config.ts";
import { getProperty } from "./notion/get-property.ts";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { getTaskById } from "./todoist/get-task-by-id.ts";
import { getProjectById } from "./todoist/get-project-by-id.ts";
import { getPagesIterator } from "./notion/get-pages-iterator.ts";
import type { TodoistEventItem } from "./todoist/types.ts";

export const syncNotionTasksToTodoist = async (
  events: TodoistEventItem[],
  databaseId: string,
  afterTimestamp?: string,
  beforeTimestamp?: string,
) => {
  const syncTasksResponse = getPagesIterator(databaseId, {
    afterTimestamp,
    beforeTimestamp,
    sourceIsNotEmpty: true,
  });

  for await (const notionTask of syncTasksResponse) {
    const todoistTaskId = getProperty(
      notionTask.properties,
      "Source",
      "rich_text",
    ).rich_text[0]?.plain_text;

    if (!todoistTaskId) {
      throw new Error("Notion task does not have a Source property");
    }

    console.log(`Syncing task ${todoistTaskId}`);

    const todoistTask = events.find((event) => event.id === todoistTaskId);

    if (!todoistTask) {
      console.warn(`Task ${todoistTaskId} not found, archiving Notion task`);
      await notion.pages.update({ page_id: notionTask.id, archived: true });
      continue;
    }

    const fromNotion = {
      source: "notion",
      lastEditedTime: new Date(notionTask.last_edited_time),
      content: getProperty(notionTask.properties, "Name", "title").title[0]
        ?.plain_text,
      isCompleted:
        getProperty(notionTask.properties, "Status", "status").status?.name ===
        "Done",
      project: getProperty(notionTask.properties, "Project", "select").select
        ?.name,
    } as const;

    const fromTodoist = {
      source: "todoist",
      lastEditedTime: new Date(todoistTask.updated_at),
      content: todoistTask.content,
      isCompleted: todoistTask.checked,
      project: await getProjectById(todoistTask.project_id),
    } as const;

    const sourceOfTruth =
      fromNotion.lastEditedTime > fromTodoist.lastEditedTime
        ? fromNotion
        : fromTodoist;

    try {
      const todoistTask = await getTaskById(todoistTaskId);

      if (fromNotion.isCompleted) {
        console.log(`Marking task ${todoistTaskId} as done`);
        await todoist.closeTask(todoistTaskId);
      }

      if (fromNotion.content !== todoistTask.content) {
        console.log(`Updating task ${todoistTaskId}`);
        await todoist.updateTask(todoistTaskId, fromNotion);
      }

      await notion.pages.update({
        page_id: notionTask.id,
        properties: {
          Labels: {
            multi_select: todoistTask.labels.map((label) => ({ name: label })),
          },
          Project: {
            select: todoistProject ? { name: todoistProject.name } : null,
          },
          Priority: {
            select: todoistTask.priority
              ? { name: `Priority ${todoistTask.priority}` }
              : null,
          },
          Due: {
            date: todoistTask.due ? { start: todoistTask.due.date } : null,
          },
          ...(todoistTask.isCompleted
            ? { Status: { status: { name: "Done" } } }
            : {}),
        },
      });
    } catch (e) {
      if (!(e instanceof TodoistRequestError)) {
        throw e;
      }

      if (e.httpStatusCode === 404) {
        console.warn(`Task ${todoistTaskId} not found, archiving Notion task`);
        await notion.pages.update({ page_id: notionTask.id, archived: true });
      }
    }
  }
};
