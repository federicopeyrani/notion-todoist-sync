import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getProperty } from "./get-property.ts";

export const isChecked = (page: PageObjectResponse) =>
  getProperty(page.properties, "Status", "status").status?.name === "Done";
