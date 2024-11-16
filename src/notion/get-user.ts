import { notion, userEmailAddress } from "../utils/config.ts";
import { InMemoryCache } from "../utils/in-memory-cache.ts";
import type { UserObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const cache = new InMemoryCache<UserObjectResponse>(5 * 60 * 1000);

export const getUser = () =>
  cache.getOrSet(userEmailAddress, async () => {
    const notionUsers = await notion.users.list({});
    const notionUser = notionUsers.results.find(
      (user) =>
        user.type === "person" && user.person?.email === userEmailAddress,
    );

    if (!notionUser) {
      throw new Error("Notion user not found");
    }

    return notionUser;
  });
