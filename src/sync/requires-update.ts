import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { TodoistEventItem } from "../todoist/types.ts";
import { isChecked } from "../notion/is-checked.ts";
import { getTodoistTaskPayload } from "./get-todoist-task-payload.ts";

export const requiresUpdate = async (
  notionPage: PageObjectResponse,
  event?: TodoistEventItem,
) => {
  if (!event) {
    return true;
  }

  const isNotionPageArchived = notionPage.archived || notionPage.in_trash;
  if (event.is_deleted !== isNotionPageArchived) {
    return true;
  }

  if (isChecked(notionPage) !== event.checked) {
    return true;
  }

  const mappedTodoistTask = await getTodoistTaskPayload(notionPage);

  const mappedDateISO = mappedTodoistTask.dueString
    ? new Date(mappedTodoistTask.dueString).toISOString()
    : undefined;
  const eventDateISO = event.due?.date
    ? new Date(event.due.date).toISOString()
    : undefined;

  return (
    mappedTodoistTask.content !== event.content ||
    mappedTodoistTask.labels?.join() !== event.labels.join() ||
    mappedTodoistTask.projectId !== event.project_id ||
    mappedTodoistTask.priority !== event.priority ||
    mappedDateISO !== eventDateISO
  );
};
