import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function ensureVectorExtension() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
}
