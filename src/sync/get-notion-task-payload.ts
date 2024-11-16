import { getUser } from "../notion/get-user.ts";
import { getProjectById } from "../todoist/get-project-by-id.ts";
import { notion } from "../utils/config.ts";
import type {
  CreatePageParameters,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";

type Properties = CreatePageParameters["properties"] &
  UpdatePageParameters["properties"];

export const getNotionTaskPayload = async (
  databaseId: string,
  task: TodoistEventItem,
  onFail: (
    todoistParentTaskId: string,
  ) => Promise<string | undefined> = async () => undefined,
): Promise<Properties> => {
  const notionUser = await getUser();
  const todoistProject = await getProjectById(task.project_id);

  const existingParentTasks = task.parent_id
    ? await notion.databases.query({
        database_id: databaseId,
        filter: { property: "Source", rich_text: { equals: task.parent_id } },
      })
    : undefined;

  const parentTask = existingParentTasks?.results[0]
    ? existingParentTasks.results[0]?.id
    : task.parent_id
      ? await onFail(task.parent_id)
      : undefined;

  const date =
    task.due && task.due.date
      ? new Date(task.due.date).toISOString()
      : undefined;

  return {
    Name: {
      type: "title",
      title: [{ type: "text", text: { content: task.content } }],
    },
    Assignee: {
      type: "people",
      people: [{ id: notionUser.id }],
    },
    Status: {
      type: "status",
      status: { name: task.checked ? "Done" : "To-do" },
    },
    Source: {
      type: "rich_text",
      rich_text: [{ type: "text", text: { content: task.id } }],
    },
    Labels: {
      type: "multi_select",
      multi_select: task.labels.map((label) => ({ name: label })),
    },
    Project: {
      type: "select",
      select: { name: todoistProject.name },
    },
    Priority: {
      type: "select",
      select: { name: `Priority ${task.priority}` },
    },
    Due: {
      type: "date",
      date: date ? { start: date } : null,
    },
    "Parent task": {
      type: "relation",
      relation: parentTask ? [{ id: parentTask }] : [],
    },
  };
};
