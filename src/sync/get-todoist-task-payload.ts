import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
  AddTaskArgs,
  UpdateTaskArgs,
} from "@doist/todoist-api-typescript/dist/types/requests";
import { getProperty } from "../notion/get-property.ts";
import { notion } from "../utils/config.ts";
import { getProjectByName } from "../todoist/get-project-by-name.ts";
import { isFullPage } from "@notionhq/client";

export const getTodoistTaskPayload = async (
  page: PageObjectResponse,
): Promise<AddTaskArgs & UpdateTaskArgs> => {
  const parent = getProperty(page.properties, "Parent task", "relation")
    .relation[0];
  const parentPage = parent
    ? await notion.pages.retrieve({ page_id: parent.id })
    : undefined;

  const projectName = getProperty(page.properties, "Project", "select").select
    ?.name;
  const project = projectName ? await getProjectByName(projectName) : undefined;

  const priority = getProperty(
    page.properties,
    "Priority",
    "select",
  ).select?.name?.replace(/Priority (\d)/, "$1");

  return {
    content:
      getProperty(page.properties, "Name", "title").title[0]?.plain_text ?? "",
    labels: getProperty(
      page.properties,
      "Labels",
      "multi_select",
    ).multi_select.map((label) => label.name),
    projectId: project?.id,
    priority: priority ? parseInt(priority) : undefined,
    dueString: getProperty(page.properties, "Due", "date").date?.start,
    parentId:
      parentPage && isFullPage(parentPage)
        ? getProperty(parentPage.properties, "Source", "rich_text").rich_text[0]
            ?.plain_text
        : undefined,
  };
};
