import { notion, todoist } from "./config.ts";
import { isFullPage, iteratePaginatedAPI } from "@notionhq/client";
import { getProperty } from "./notion/get-property.ts";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { getTaskById } from "./todoist/get-task-by-id.ts";
import { getProjectById } from "./todoist/get-project-by-id.ts";

export const syncNotionTasksToTodoist = async (
  databaseId: string,
  afterTimestamp?: string,
  beforeTimestamp?: string,
) => {
  const response = iteratePaginatedAPI(notion.databases.query, {
    database_id: databaseId,
    filter: {
      and: [
        ...(afterTimestamp
          ? ([
              {
                timestamp: "last_edited_time",
                last_edited_time: { after: afterTimestamp },
              },
            ] as const)
          : []),
        ...(beforeTimestamp
          ? ([
              {
                timestamp: "last_edited_time",
                last_edited_time: { before: beforeTimestamp },
              },
            ] as const)
          : []),
        { property: "Source", rich_text: { is_not_empty: true } },
        { property: "Status", status: { does_not_equal: "Done" } },
      ],
    },
  });

  for await (const task of response) {
    if (!isFullPage(task)) {
      throw new Error("Notion task is not a full page");
    }

    const todoistTaskId = getProperty(task.properties, "Source", "rich_text")
      .rich_text[0]?.plain_text;

    if (!todoistTaskId) {
      throw new Error("Notion task does not have a Source property");
    }

    console.log(`Syncing task ${todoistTaskId}`);

    const fromNotion = {
      content: getProperty(task.properties, "Name", "title").title[0]
        ?.plain_text,
      isCompleted:
        getProperty(task.properties, "Status", "status").status?.name ===
        "Done",
    };

    try {
      const todoistTask = await getTaskById(todoistTaskId);
      const project = await getProjectById(todoistTask.projectId);

      if (fromNotion.isCompleted) {
        console.log(`Marking task ${todoistTaskId} as done`);
        await todoist.closeTask(todoistTaskId);
      }

      if (fromNotion.content !== todoistTask.content) {
        console.log(`Updating task ${todoistTaskId}`);
        await todoist.updateTask(todoistTaskId, fromNotion);
      }

      await notion.pages.update({
        page_id: task.id,
        properties: {
          Labels: {
            multi_select: todoistTask.labels.map((label) => ({ name: label })),
          },
          Project: {
            select: project ? { name: project.name } : null,
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
        await notion.pages.update({ page_id: task.id, archived: true });
      }
    }
  }
};
