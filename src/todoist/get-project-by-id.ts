import type { Project } from "@doist/todoist-api-typescript";
import { InMemoryCache } from "../utils/in-memory-cache.ts";
import { todoist } from "../utils/config.ts";

const cache = new InMemoryCache<Project>(5 * 60 * 1000);

export const getProjectById = async (id: string) =>
  cache.getOrSet(id, () => todoist.getProject(id));
