import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getTodoistTaskPayload } from "./get-todoist-task-payload.ts";
import { todoist } from "../utils/config.ts";
import { isChecked } from "../notion/is-checked.ts";

export const syncNotionTask = async (
  page: PageObjectResponse,
  taskId: string,
) => {
  const payload = await getTodoistTaskPayload(page);
  await todoist.updateTask(taskId, payload);

  if (isChecked(page)) {
    await todoist.closeTask(taskId);
  }
};
