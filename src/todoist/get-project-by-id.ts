import type { Project } from "@doist/todoist-api-typescript";
import { InMemoryCache } from "../utils/in-memory-cache.ts";
import { cacheExpirationMilliseconds, todoist } from "../utils/config.ts";

const cache = new InMemoryCache<Project>(cacheExpirationMilliseconds);

export const getProjectById = async (id: string) =>
  cache.getOrSet(id, () => todoist.getProject(id));
