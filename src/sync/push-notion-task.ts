import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, todoist } from "../utils/config.ts";
import { getTodoistTaskPayload } from "./get-todoist-task-payload.ts";

export const pushNotionTask = async (task: PageObjectResponse) => {
  const payload = await getTodoistTaskPayload(task);

  if (!payload.content) {
    console.warn(`Skipping task (id=${task.id}) because it has no content`);
    return;
  }

  const createdTask = await todoist.addTask(payload, `create-from-${task.id}`);

  await notion.pages.update({
    page_id: task.id,
    properties: {
      Source: { rich_text: [{ text: { content: createdTask.id } }] },
    },
  });

  return createdTask;
};
