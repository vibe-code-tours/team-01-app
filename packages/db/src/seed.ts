import { randomBytes, scrypt } from "node:crypto";
import { count, eq, sql } from "drizzle-orm";
import { closeDb, db } from "./db.js";
import { user, account } from "./schema/auth.js";
import { products, provinces, subscriptionPackages, townships } from "./schema/index.js";

const SEED_TABLES = ["account", "user", "townships", "provinces", "subscription_packages", "products"] as const;

const SUPER_ADMIN = {
  email: "admin@waterdelivery.com",
  name: "Super Admin",
  password: "Water@Delivery1",
  role: "super-admin",
  status: "active",
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${key.toString("hex")}`;
}

async function clearSeedData(): Promise<void> {
  await db.execute(sql.raw(`TRUNCATE ${SEED_TABLES.map((t) => (t === "user" ? `"${t}"` : t)).join(", ")} CASCADE`));
  console.log("Cleared seed data");
}

async function hasSeedData(): Promise<boolean> {
  const [result] = await db.select({ count: count() }).from(products);
  return result.count > 0;
}

async function seedSuperAdmin(): Promise<void> {
  const [existing] = await db.select().from(user).where(eq(user.email, SUPER_ADMIN.email));
  if (existing) {
    console.log("Super-admin already exists, skipping");
    return;
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(SUPER_ADMIN.password);

  await db.insert(user).values({
    id: userId,
    email: SUPER_ADMIN.email,
    name: SUPER_ADMIN.name,
    role: SUPER_ADMIN.role,
    status: SUPER_ADMIN.status,
    emailVerified: true,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: SUPER_ADMIN.email,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  console.log(`Seeded super-admin: ${SUPER_ADMIN.email}`);
}

async function runSeed(): Promise<void> {
  console.log("Seeding database...");

  await seedSuperAdmin();

  const productData = [
    {
      name: "350ml Water",
      description: "Perfect for on-the-go. Compact and refreshing.",
      price: "5000",
      type: "retail" as const,
      packSize: "12 bottles",
      status: "active" as const,
    },
    {
      name: "500ml Water",
      description: "Ideal for daily hydration. Great for office and home.",
      price: "7000",
      type: "retail" as const,
      packSize: "12 bottles",
      status: "active" as const,
    },
    {
      name: "1L Water",
      description: "Family size. Perfect for meals and gatherings.",
      price: "10000",
      type: "retail" as const,
      packSize: "12 bottles",
      status: "active" as const,
    },
    {
      name: "1.5L Water",
      description: "Extra capacity for active families and events.",
      price: "13000",
      type: "retail" as const,
      packSize: "12 bottles",
      status: "active" as const,
    },
    {
      name: "Water Pump",
      description: "Easy-to-use dispenser pump for 20L bottles.",
      price: "15000",
      type: "pump" as const,
      packSize: "1 unit",
      status: "active" as const,
    },
    {
      name: "Stainless Bottle 500ml",
      description: "Durable, BPA-free stainless steel bottle.",
      price: "18000",
      type: "bottle" as const,
      packSize: "500ml",
      status: "active" as const,
    },
    {
      name: "Stainless Bottle 1L",
      description: "Large capacity stainless steel bottle.",
      price: "25000",
      type: "bottle" as const,
      packSize: "1L",
      status: "active" as const,
    },
  ];

  await db.insert(products).values(productData);
  console.log(`Seeded ${productData.length} products`);

  const subscriptionData = [
    {
      name: "Starter",
      couponCount: 5,
      price: "50000",
      description: "Try our 20L delivery service",
      status: "active" as const,
    },
    {
      name: "Regular",
      couponCount: 12,
      price: "100000",
      description: "Great value for regular users",
      status: "active" as const,
    },
    {
      name: "Premium",
      couponCount: 24,
      price: "180000",
      description: "Best value for families",
      status: "active" as const,
    },
  ];

  await db.insert(subscriptionPackages).values(subscriptionData);
  console.log(`Seeded ${subscriptionData.length} subscription packages`);

  const provinceData = [
    { name: "Yangon", isActive: true },
    { name: "Mandalay", isActive: true },
    { name: "Naypyidaw", isActive: true },
    { name: "Shan", isActive: true },
    { name: "Ayeyarwady", isActive: true },
    { name: "Bago", isActive: true },
    { name: "Magway", isActive: true },
    { name: "Sagaing", isActive: true },
    { name: "Tanintharyi", isActive: true },
    { name: "Mon", isActive: true },
    { name: "Kayin", isActive: true },
    { name: "Kayah", isActive: true },
    { name: "Chin", isActive: true },
    { name: "Kachin", isActive: true },
    { name: "Rakhine", isActive: true },
  ];

  const insertedProvinces = await db.insert(provinces).values(provinceData).returning();
  console.log(`Seeded ${insertedProvinces.length} provinces`);

  const yangonProvince = insertedProvinces.find((p) => p.name === "Yangon");
  if (yangonProvince) {
    const townshipData = [
      { provinceId: yangonProvince.id, name: "Hlaing", isActive: true },
      { provinceId: yangonProvince.id, name: "Hmawakan", isActive: true },
      { provinceId: yangonProvince.id, name: "Insein", isActive: true },
      { provinceId: yangonProvince.id, name: "Kamayut", isActive: true },
      { provinceId: yangonProvince.id, name: "Kyimyindaing", isActive: true },
      { provinceId: yangonProvince.id, name: "Lanmadaw", isActive: true },
      { provinceId: yangonProvince.id, name: "Latha", isActive: true },
      { provinceId: yangonProvince.id, name: "Mayangon", isActive: true },
      { provinceId: yangonProvince.id, name: "Mingalardon", isActive: true },
      { provinceId: yangonProvince.id, name: "Mingalartaungnyunt", isActive: true },
      { provinceId: yangonProvince.id, name: "North Dagon", isActive: true },
      { provinceId: yangonProvince.id, name: "North Okkalapa", isActive: true },
      { provinceId: yangonProvince.id, name: "Pabedan", isActive: true },
      { provinceId: yangonProvince.id, name: "Pazundaung", isActive: true },
      { provinceId: yangonProvince.id, name: "Sanchaung", isActive: true },
      { provinceId: yangonProvince.id, name: "Seikkyi Kanaungto", isActive: true },
      { provinceId: yangonProvince.id, name: "Shwepyitha", isActive: true },
      { provinceId: yangonProvince.id, name: "South Dagon", isActive: true },
      { provinceId: yangonProvince.id, name: "South Okkalapa", isActive: true },
      { provinceId: yangonProvince.id, name: "Tamwe", isActive: true },
      { provinceId: yangonProvince.id, name: "Thaketa", isActive: true },
      { provinceId: yangonProvince.id, name: "Thingangyun", isActive: true },
      { provinceId: yangonProvince.id, name: "Yankin", isActive: true },
    ];

    await db.insert(townships).values(townshipData);
    console.log(`Seeded ${townshipData.length} townships for Yangon`);
  }

  const mandalayProvince = insertedProvinces.find((p) => p.name === "Mandalay");
  if (mandalayProvince) {
    const townshipData = [
      { provinceId: mandalayProvince.id, name: "Aungmyethazan", isActive: true },
      { provinceId: mandalayProvince.id, name: "Chanayethazan", isActive: true },
      { provinceId: mandalayProvince.id, name: "Chanmyathazi", isActive: true },
      { provinceId: mandalayProvince.id, name: "Maharaungmyay", isActive: true },
      { provinceId: mandalayProvince.id, name: "Patheingyi", isActive: true },
      { provinceId: mandalayProvince.id, name: "Pyigyidagun", isActive: true },
    ];

    await db.insert(townships).values(townshipData);
    console.log(`Seeded ${townshipData.length} townships for Mandalay`);
  }

  console.log("Seed completed!");
}

async function main(): Promise<void> {
  const fresh = process.argv.includes("--fresh");

  if (fresh) {
    await clearSeedData();
  } else if (await hasSeedData()) {
    console.log("Seed data already exists. Run: npm run db:reseed");
    return;
  }

  await runSeed();
}

main()
  .catch((err: unknown) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
