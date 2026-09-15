import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { categories, inventory, products, settings } from "../drizzle/schema";

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const db = drizzle(pool);
const images = {
  skincare: "/manus-storage/nadola-skincare_b2c88fad.jpg",
  bodycare: "/manus-storage/nadola-bodycare_58dacbca.jpg",
  moisturizers: "/manus-storage/nadola-moisturizers_5a5fa403.jpg",
  flatlay: "/manus-storage/nadola-flatlay_17e21b5b.jpg",
};

const categoryRows = [
  { name: "العناية بالبشرة", slug: "skincare", imageUrl: images.skincare },
  { name: "العناية بالجسم", slug: "body-care", imageUrl: images.bodycare },
  { name: "المرطبات", slug: "moisturizers", imageUrl: images.moisturizers },
  { name: "العروض", slug: "offers", imageUrl: images.flatlay },
];

const productRows = [
  ["مرطب الجسم بزبدة الشيا", "body-butter-shea", "العناية بالجسم", "250 مل", 18500, images.bodycare, "الأكثر مبيعاً", 14, 49, true],
  ["كريم العناية اليومية", "daily-care-cream", "العناية بالبشرة", "100 مل", 22000, images.skincare, "جديد", 9, 48, false],
  ["لوشن الجسم الناعم", "soft-body-lotion", "العناية بالجسم", "300 مل", 16500, images.bodycare, "عرض", 7, 47, false],
  ["كريم ترطيب البشرة", "skin-moisture-cream", "المرطبات", "50 مل", 19500, images.moisturizers, null, 24, 49, false],
  ["زبدة الجسم المركزة", "rich-body-butter", "العناية بالجسم", "200 مل", 24000, images.bodycare, "متبقي قليل", 4, 48, false],
  ["سيروم الإشراقة اليومي", "daily-glow-serum", "العناية بالبشرة", "30 مل", 28000, images.skincare, "جديد", 12, 46, false],
  ["كريم اليدين الحريري", "silky-hand-cream", "العناية بالجسم", "75 مل", 12000, images.moisturizers, null, 31, 47, false],
  ["مرطب الوجه الخفيف", "light-face-moisturizer", "المرطبات", "60 مل", 21000, images.skincare, "الأكثر مبيعاً", 6, 49, true],
  ["غسول الوجه اللطيف", "gentle-face-cleanser", "العناية بالبشرة", "150 مل", 17500, images.skincare, null, 18, 45, false],
  ["كريم القدمين المغذي", "nourishing-foot-cream", "العناية بالجسم", "100 مل", 14500, images.bodycare, null, 11, 46, false],
  ["بلسم الجسم اليومي", "daily-body-balm", "العناية بالجسم", "250 مل", 18500, images.bodycare, null, 8, 47, false],
  ["كريم ليلي مريح", "comfort-night-cream", "العناية بالبشرة", "50 مل", 23500, images.moisturizers, "متبقي قليل", 3, 48, false],
] as const;

async function seed() {
  for (const category of categoryRows) {
    await db.insert(categories).values(category).onConflictDoUpdate({ target: categories.slug, set: { name: category.name, imageUrl: category.imageUrl } });
  }
  for (const [name, slug, categoryName, size, price, imageUrl, badge, stockQuantity, rating, isBestSeller] of productRows) {
    await db.insert(products).values({
      name, slug, categoryName, size, price, imageUrl, badge,
      description: "وصف تجريبي قابل للتعديل من لوحة الإدارة. لا يتضمن ادعاءات طبية أو علاجية.",
      ingredients: "تُضاف المكونات بعد اعتماد بيانات المنتج.", usage: "تُضاف طريقة الاستخدام بعد اعتماد بيانات المنتج.",
      stockQuantity, lowStockThreshold: 5, rating, isFeatured: true, isBestSeller, status: "active",
    }).onConflictDoUpdate({ target: products.slug, set: { name, categoryName, size, price, imageUrl, badge, stockQuantity, rating, isBestSeller, updatedAt: new Date() } });
    const product = (await db.select().from(products).where(eq(products.slug, slug)).limit(1))[0];
    if (product) await db.insert(inventory).values({ productId: product.id, quantity: stockQuantity, lowStockThreshold: 5 }).onConflictDoUpdate({ target: inventory.productId, set: { quantity: stockQuantity, updatedAt: new Date() } });
  }
  for (const setting of [
    { settingKey: "whatsapp_number", settingValue: "249900000000" },
    { settingKey: "instagram_url", settingValue: "https://instagram.com/nadola.collection" },
    { settingKey: "facebook_url", settingValue: "https://facebook.com/nadola.collection" },
  ]) await db.insert(settings).values(setting).onConflictDoUpdate({ target: settings.settingKey, set: { settingValue: setting.settingValue } });
  console.log(`Seeded ${productRows.length} Nadola demo products and ${categoryRows.length} categories.`);
}

seed().catch((error) => { console.error(error); process.exit(1); }).finally(() => pool.end());
