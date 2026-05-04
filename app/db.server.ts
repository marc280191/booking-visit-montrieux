import { PrismaClient } from "@prisma/client";

declare global {
  var __db: PrismaClient | undefined;
}

const db = global.__db ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

export default db;
export { db };