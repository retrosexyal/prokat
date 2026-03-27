import clientPromise from "@/lib/mongodb";
import { getCityByName, DEFAULT_CITY_SLUG, getCityBySlug } from "@/lib/cities";

async function run() {
  const client = await clientPromise;
  const db = client.db();

  const products = await db.collection("products").find({}).toArray();

  for (const product of products) {
    const resolved =
      getCityByName(String(product.city ?? "")) ??
      getCityBySlug(DEFAULT_CITY_SLUG)!;

    await db.collection("products").updateOne(
      { _id: product._id },
      {
        $set: {
          city: resolved.name,
          citySlug: resolved.slug,
        },
      },
    );
  }

  console.log(`Updated ${products.length} products`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});