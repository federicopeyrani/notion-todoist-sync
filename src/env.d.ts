declare module "bun" {
  interface Env {
    USER_EMAIL_ADDRESS: string;
    NOTION_TOKEN: string;
    NOTION_DATABASE_ID: string;
    TODOIST_API_KEY: string;
  }
}
