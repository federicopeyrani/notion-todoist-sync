declare module "bun" {
  interface Env {
    SYNC_TASK_INTERVAL_MILLIS: `${number}`;
    CACHE_EXPIRATION_MILLIS: `${number}`;
    USER_EMAIL_ADDRESS: string;
    NOTION_TOKEN: string;
    NOTION_DATABASE_ID: string;
    TODOIST_API_KEY: string;
  }
}
