import { notion } from "../utils/config.ts";
import { isFullPage } from "@notionhq/client";

export const getPageByTaskId = async (databaseId: string, taskId: string) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { property: "Source", rich_text: { equals: taskId } },
    page_size: 1,
    archived: true,
    in_trash: true,
  });

  const page = response.results[0];

  if (!page) {
    return undefined;
  }

  if (!isFullPage(page)) {
    throw new Error(`Page is not full: ${page.id}`);
  }

  return page;
};
