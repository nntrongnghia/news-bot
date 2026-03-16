import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deletedArticles = await prisma.article.deleteMany();
  const deletedReports = await prisma.report.deleteMany();
  console.log(`Purged ${deletedArticles.count} articles, ${deletedReports.count} reports`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
