import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

const weeklySlots: Record<number, Array<[string, string]>> = {
  4: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  5: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  6: [['11:00', '12:00'], ['14:00', '15:00'], ['16:00', '17:00'], ['17:00', '18:00']],
};

async function main() {
  const shop = await prisma.shop.upsert({
    where: { shopDomain: 'distillerie-montrieux.myshopify.com' },
    update: {},
    create: { shopDomain: 'distillerie-montrieux.myshopify.com' },
  });

  for (let i = 0; i < 120; i += 1) {
    const date = addDays(new Date(), i);
    const day = Number(format(date, 'i')); // 1 Monday .. 7 Sunday
    const slots = weeklySlots[day];
    if (!slots) continue;

    for (const [startTime, endTime] of slots) {
      await prisma.bookingSlot.upsert({
        where: {
          shopId_date_startTime_endTime: {
            shopId: shop.id,
            date,
            startTime,
            endTime,
          },
        },
        update: {},
        create: {
          shopId: shop.id,
          date,
          startTime,
          endTime,
          capacityMax: 15,
        },
      });
    }
  }
}

main().finally(async () => prisma.$disconnect());
