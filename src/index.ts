import {
  notionDatabaseId,
  syncTaskIntervalMilliseconds,
} from "./utils/config.ts";
import { syncNotionTasksToTodoist } from "./sync/sync-notion-tasks-to-todoist.ts";
import { ParametersStore } from "./data/parameters-store.ts";

const store = await ParametersStore.new("./.store.json");

const task = async () => {
  console.log("Beginning sync task\u2026");

  const storeData = await store.read();
  const afterUpdateTimestamp = new Date();

  const newTodoistSyncToken = await syncNotionTasksToTodoist(
    notionDatabaseId,
    storeData.todoistSyncToken,
    storeData.afterUpdateTimestamp?.toISOString(),
  );

  await store.write({
    todoistSyncToken: newTodoistSyncToken,
    afterUpdateTimestamp,
  });

  console.log("Done");
  console.log("Sleeping\u2026");
};

await task();

setInterval(
  () => task().catch((error) => console.error("Unhandled error", error)),
  syncTaskIntervalMilliseconds,
);
