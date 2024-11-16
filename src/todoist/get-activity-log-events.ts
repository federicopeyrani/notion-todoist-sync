import { todoistToken } from "../utils/config.ts";
import wretch from "wretch";
import FormDataAddon from "wretch/addons/formData";
import type { TodoistActivitySyncResponse } from "./types.ts";

export const getActivityLogEvents = (syncToken: string = "*") =>
  wretch("https://api.todoist.com/sync/v9/sync")
    .addon(FormDataAddon)
    .auth(`Bearer ${todoistToken}`)
    .formData({
      sync_token: syncToken,
      resource_types: '["items"]',
    })
    .post()
    .json<TodoistActivitySyncResponse>();
