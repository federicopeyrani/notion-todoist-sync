import { iteratePaginatedAPI } from "@notionhq/client";
import { notion } from "../config.ts";
import { mapPagesIterator } from "./map-pages-iterator.ts";

export interface GetPagesIteratorOptions {
  afterTimestamp?: string;
  beforeTimestamp?: string;
  sourceIsNotEmpty?: boolean;
}

export const getPagesIterator = (
  databaseId: string,
  {
    afterTimestamp,
    beforeTimestamp,
    sourceIsNotEmpty,
  }: GetPagesIteratorOptions = {},
) =>
  mapPagesIterator(
    iteratePaginatedAPI(notion.databases.query, {
      database_id: databaseId,
      filter: {
        and: [
          { property: "Status", status: { does_not_equal: "Done" } },
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
