import { Db } from "mongodb";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё-]/gi, "")
    .replace(/-+/g, "-");
}

export async function generateUniqueSlug(db: Db, base: string) {
  const slugBase = slugify(base);
  let slug = slugBase;
  let counter = 1;

  while (await db.collection("products").findOne({ slug })) {
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }

  return slug;
}
