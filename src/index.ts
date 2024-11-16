import {
  notionDatabaseId,
  syncTaskIntervalMilliseconds,
} from "./utils/config.ts";
import { syncNotionTasksToTodoist } from "./sync/sync-notion-tasks-to-todoist.ts";

let afterUpdateTimestamp: string | undefined;
let nextAfterUpdateTimestamp: string | undefined;
let todoistSyncToken: string | undefined;

const task = async () => {
  console.log("Syncing tasks between Notion and Todoist");

  afterUpdateTimestamp = new Date().toISOString();

  todoistSyncToken = await syncNotionTasksToTodoist(
    notionDatabaseId,
    todoistSyncToken,
    nextAfterUpdateTimestamp,
  );

  nextAfterUpdateTimestamp = afterUpdateTimestamp;

  console.log("Done");
  console.log("Sleeping...");
};

await task();

setInterval(
  () => task().catch((error) => console.error("Unhandled error", error)),
  syncTaskIntervalMilliseconds,
);
