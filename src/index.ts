import { notion, notionDatabaseId, todoist } from "./config.ts";
import { isFullPage, iteratePaginatedAPI } from "@notionhq/client";
import type {
  CreatePageResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getProjectByName } from "./todoist/get-project-by-name.ts";
import { getProperty } from "./notion/get-property.ts";
import { getProjectById } from "./todoist/get-project-by-id.ts";
import type { Task } from "@doist/todoist-api-typescript";
import { getTaskById } from "./todoist/get-task-by-id.ts";
import { syncNotionTasksToTodoist } from "./sync-notion-tasks-to-todoist.ts";
import { getActivityLogEvents } from "./todoist/get-activity-log-events.ts";
import { getUser } from "./notion/get-user.ts";

const notionUser = getUser();

const pushNotionTaskToTodoist = async (task: PageObjectResponse) => {
  const parent = getProperty(task.properties, "Parent task", "relation")
    .relation[0];
  const parentPage = parent
    ? await notion.pages.retrieve({ page_id: parent.id })
    : undefined;

  const projectName = getProperty(task.properties, "Project", "select").select
    ?.name;
  const project = projectName ? await getProjectByName(projectName) : undefined;

  const priority = getProperty(
    task.properties,
    "Priority",
    "select",
  ).select?.name?.replace(/Priority (\d)/, "$1");

  const createdTask = await todoist.addTask({
    content:
      getProperty(task.properties, "Name", "title").title[0]?.plain_text ?? "",
    labels: getProperty(
      task.properties,
      "Labels",
      "multi_select",
    ).multi_select.map((label) => label.name),
    projectId: project?.id,
    priority: priority ? parseInt(priority) : undefined,
    dueString: getProperty(task.properties, "Due", "date").date?.start,
    parentId:
      parentPage && isFullPage(parentPage)
        ? getProperty(parentPage.properties, "Source", "rich_text").rich_text[0]
            ?.plain_text
        : undefined,
  });

  await notion.pages.update({
    page_id: task.id,
    properties: {
      Source: { rich_text: [{ text: { content: createdTask.id } }] },
    },
  });

  return createdTask;
};

const pushNotionTasksToTodoist = async (databaseId: string) => {
  console.log("Querying Notion tasks...");

  const response = iteratePaginatedAPI(notion.databases.query, {
    database_id: databaseId,
    filter: {
      and: [
        { property: "Source", rich_text: { is_empty: true } },
        { property: "Status", status: { does_not_equal: "Done" } },
      ],
    },
  });

  for await (const task of response) {
    if (!isFullPage(task)) {
      throw new Error("Notion task is not a full page");
    }

    console.log(`Pushing task ${task.id}`);
    await pushNotionTaskToTodoist(task);
  }
};

const pushTodoistTaskToNotion = async (
  task: Task,
): Promise<CreatePageResponse> => {
  const project = await getProjectById(task.projectId);

  console.log(`Pushing task ${task.id}`);

  const existingParentTasks = task.parentId
    ? await notion.databases.query({
        database_id: notionDatabaseId,
        filter: { property: "Source", rich_text: { equals: task.parentId } },
      })
    : undefined;

  const parentTask = existingParentTasks?.results[0]
    ? existingParentTasks.results[0]
    : task.parentId
      ? await pushTodoistTaskToNotion(await getTaskById(task.parentId))
      : undefined;

  return notion.pages.create({
    parent: { database_id: notionDatabaseId },
    properties: {
      Name: {
        type: "title",
        title: [{ type: "text", text: { content: task.content } }],
      },
      Assignee: {
        type: "people",
        people: [{ id: notionUser.id }],
      },
      Status: {
        type: "status",
        status: { name: task.isCompleted ? "Done" : "To-do" },
      },
      Source: {
        type: "rich_text",
        rich_text: [{ type: "text", text: { content: task.id } }],
      },
      Labels: {
        type: "multi_select",
        multi_select: task.labels.map((label) => ({ name: label })),
      },
      Project: {
        type: "select",
        select: { name: project.name },
      },
      Priority: {
        type: "select",
        select: { name: `Priority ${task.priority}` },
      },
      Due: {
        type: "date",
        date: task.due ? { start: task.due?.date } : null,
      },
      "Parent task": {
        type: "relation",
        relation: parentTask ? [{ id: parentTask.id }] : [],
      },
    },
  });
};

const pushTodoistTasksToNotion = async () => {
  console.log("Querying Todoist tasks...");
  const tasks = await todoist.getTasks();
  console.log(`Got ${tasks.length} tasks`);

  for (const task of tasks) {
    const existingTasks = await notion.databases.query({
      database_id: notionDatabaseId,
      filter: {
        property: "Source",
        rich_text: { equals: task.id },
      },
    });

    if (existingTasks.results.length > 0) {
      console.log(`Task ${task.id} already exists in Notion`);
      continue;
    }

    await pushTodoistTaskToNotion(task);
  }
};

let afterUpdateTimestamp: string | undefined;
let nextAfterUpdateTimestamp: string | undefined;
let todoistSyncToken: string | undefined;

const task = async () => {
  console.log(`Syncing tasks at ${new Date().toISOString()}`);

  console.log("Pushing Notion tasks to Todoist");
  await pushNotionTasksToTodoist(notionDatabaseId);

  console.log("Pushing Todoist tasks to Notion");
  // await pushTodoistTasksToNotion();

  console.log("Syncing tasks between Notion and Todoist");

  const todoistSyncResponse = await getActivityLogEvents(todoistSyncToken);
  todoistSyncToken = todoistSyncResponse.sync_token;

  afterUpdateTimestamp = new Date().toISOString();
  await syncNotionTasksToTodoist(notionDatabaseId, nextAfterUpdateTimestamp);
  nextAfterUpdateTimestamp = afterUpdateTimestamp;

  console.log("Done");
  console.log("Sleeping...");
};

await task();
setInterval(task, 5 * 60 * 1000);
