import { iteratePaginatedAPI } from "@notionhq/client";
import { notion } from "../utils/config.ts";
import { mapPagesIterator } from "./map-pages-iterator.ts";
import { getBot } from "./get-bot.ts";

export interface GetPagesIteratorOptions {
  afterTimestamp?: string;
  beforeTimestamp?: string;
  sourceIsNotEmpty?: boolean;
}

export const getPagesIterator = async (
  databaseId: string,
  {
    afterTimestamp,
    beforeTimestamp,
    sourceIsNotEmpty,
  }: GetPagesIteratorOptions = {},
) => {
  const bot = await getBot();

  return mapPagesIterator(
    iteratePaginatedAPI(notion.databases.query, {
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "Last edited by",
            people: { does_not_contain: bot.id },
          },
          {
            property: "Source",
            rich_text: sourceIsNotEmpty
              ? { is_not_empty: true }
              : { is_empty: true },
          },
          ...(afterTimestamp
            ? ([
                {
                  timestamp: "last_edited_time",
                  last_edited_time: { after: afterTimestamp },
                },
              ] as const)
            : []),
          ...(beforeTimestamp
            ? ([
                {
                  timestamp: "last_edited_time",
                  last_edited_time: { before: beforeTimestamp },
                },
              ] as const)
            : []),
        ],
      },
    }),
  );
};
