import { getNotionTaskPayload } from "./get-notion-task-payload.ts";
import { notion } from "../utils/config.ts";
import type { TodoistEventItem } from "../todoist/types.ts";

export const pushTodoistTask = async (
  task: TodoistEventItem,
  databaseId: string,
) => {
  const payload = await getNotionTaskPayload(databaseId, task);
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: payload,
  });
};
