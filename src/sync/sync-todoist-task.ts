import { getNotionTaskPayload } from "./get-notion-task-payload.ts";
import { notion } from "../utils/config.ts";
import type { TodoistEventItem } from "../todoist/types.ts";

export const syncTodoistTask = async (
  task: TodoistEventItem,
  databaseId: string,
  pageId: string,
) => {
  const payload = await getNotionTaskPayload(databaseId, task);
  return notion.pages.update({
    page_id: pageId,
    properties: payload,
  });
};
