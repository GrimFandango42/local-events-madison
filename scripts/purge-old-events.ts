import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAYS = Number(process.env.PURGE_DAYS || 60);

async function main() {
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const deleted = await prisma.event.deleteMany({
    where: { startDateTime: { lt: cutoff } }
  });
  console.log(`🧹 Purged ${deleted.count} events older than ${DAYS} days.`);
}

main().then(() => prisma.$disconnect());

