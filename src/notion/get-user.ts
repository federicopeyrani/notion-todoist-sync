import { notion, userEmailAddress } from "../config.ts";

export const getUser = async () => {
  const notionUsers = await notion.users.list({});
  const notionUser = notionUsers.results.find(
    (user) => user.type === "person" && user.person?.email === userEmailAddress,
  );

  if (!notionUser) {
    throw new Error("Notion user not found");
  }

  return notionUser;
};
