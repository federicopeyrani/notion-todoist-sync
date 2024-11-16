import { InMemoryCache } from "../utils/in-memory-cache.ts";
import type { Project } from "@doist/todoist-api-typescript";
import { todoist } from "../utils/config.ts";

const cache = new InMemoryCache<Project[]>(5 * 60 * 1000);

export const getProjectByName = async (name: string) => {
  const projects = await cache.getOrSet(name, () => todoist.getProjects());
  return projects.find((project) => project.name === name);
};
