import type { Task } from "@doist/todoist-api-typescript";
import { InMemoryCache } from "../in-memory-cache.ts";
import { todoist } from "../config.ts";

const cache = new InMemoryCache<Task>(5 * 60 * 1000);

export const getTaskById = async (id: string) =>
  cache.getOrSet(id, () => todoist.getTask(id));
