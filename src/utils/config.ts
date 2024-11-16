import { TodoistApi } from "@doist/todoist-api-typescript";
import { Client } from "@notionhq/client";

export const syncTaskIntervalMilliseconds = parseInt(
  Bun.env.SYNC_TASK_INTERVAL_MILLIS,
);

export const cacheExpirationMilliseconds = parseInt(
  Bun.env.CACHE_EXPIRATION_MILLIS,
);

export const userEmailAddress = Bun.env.USER_EMAIL_ADDRESS;

const notionToken = Bun.env.NOTION_TOKEN;

export const notionDatabaseId = Bun.env.NOTION_DATABASE_ID;

export const todoistToken = Bun.env.TODOIST_API_KEY;

export const notion = new Client({ auth: notionToken });

export const todoist = new TodoistApi(todoistToken);
