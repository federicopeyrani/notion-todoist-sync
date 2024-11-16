import { cacheExpirationMilliseconds, notion } from "../utils/config.ts";
import { InMemoryCache } from "../utils/in-memory-cache.ts";
import type { UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const cache = new InMemoryCache<UserObjectResponse>(
  cacheExpirationMilliseconds,
);

export const getBot = () => cache.getOrSet("bot", () => notion.users.me({}));
