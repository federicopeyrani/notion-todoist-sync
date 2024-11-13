import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

type Property = PageObjectResponse["properties"][string];

export const getProperty = <T extends Property["type"]>(
  page: PageObjectResponse["properties"],
  name: string,
  type: T,
) => {
  const prop = page[name] as (Property & { type: T }) | undefined;

  if (!prop) {
    throw new Error(`Property ${name} not found`);
  }

  if (prop.type !== type) {
    throw new Error(`Property ${name} is not of type ${type}`);
  }

  return prop;
};
