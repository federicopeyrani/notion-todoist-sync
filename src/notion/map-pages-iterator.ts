import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { isFullPage } from "@notionhq/client";

export const mapPagesIterator = (
  arg: AsyncIterableIterator<
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse
  >,
) =>
  (async function* () {
    for await (const page of arg) {
      if (!isFullPage(page)) {
        throw new Error("Notion task is not a full page");
      }

      yield page;
    }
  })();
