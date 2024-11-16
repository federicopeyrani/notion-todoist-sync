# notion-todoist-sync

# Configuration

## Environment Variables

| Environment Variable        | Description                                                       | Default Value  |
|-----------------------------|-------------------------------------------------------------------|----------------|
| `SYNC_TASK_INTERVAL_MILLIS` | Interval in milliseconds to sync tasks between Notion and Todoist | 60000          |
| `CACHE_EXPIRATION_MILLIS`   | Expiration time in milliseconds for the cache                     | 60000          |
| `STORE_PATH`                | Path to store the file for runtime data                           | `./store.json` |
| `USER_EMAIL_ADDRESS`        | Email address of the user                                         |                |
| `NOTION_TOKEN`              | Notion API token                                                  |                |
| `NOTION_DATABASE_ID`        | Notion database ID                                                |                |
| `TODOIST_API_KEY`           | Todoist API key                                                   |                |

### Example `.env.local` file

```dotenv
USER_EMAIL_ADDRESS=
NOTION_TOKEN=
NOTION_DATABASE_ID=
TODOIST_API_KEY=
```
