import type { Project } from "@doist/todoist-api-typescript";
import { InMemoryCache } from "../in-memory-cache.ts";
import { todoist } from "../config.ts";

const cache = new InMemoryCache<Project>(5 * 60 * 1000);

export const getProjectById = async (id: string) =>
  cache.getOrSet(id, () => todoist.getProject(id));
