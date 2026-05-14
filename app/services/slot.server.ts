import { SlotStatus } from '@prisma/client';
import { addDays, format, startOfDay } from 'date-fns';
import { db } from '../db.server';
import { DEFAULT_CAPACITY } from '../utils/constants';

const weeklySlots: Record<number, Array<[string, string]>> = {
  4: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  5: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  6: [['11:00', '12:00'], ['14:00', '15:00'], ['16:00', '17:00'], ['17:00', '18:00']],
};

export async function getOrCreateShop(shopDomain: string) {
  return db.shop.upsert({
    where: { shopDomain },
    update: {},
    create: { shopDomain },
  });
}

export async function ensureFutureSlots(shopDomain: string, horizon = 120) {
  const shop = await getOrCreateShop(shopDomain);

  for (let i = 0; i < horizon; i += 1) {
    const date = startOfDay(addDays(new Date(), i));
    const day = Number(format(date, 'i'));
    const slots = weeklySlots[day];

    if (!slots) continue;

    for (const [startTime, endTime] of slots) {
      await db.bookingSlot.upsert({
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
          capacityMax: DEFAULT_CAPACITY,
        },
      });
    }
  }
}

export async function listSlotsByDate(shopDomain: string, date: Date) {
  const shop = await getOrCreateShop(shopDomain);

  return db.bookingSlot.findMany({
    where: {
      shopId: shop.id,
      date: startOfDay(date),
    },
    orderBy: [{ startTime: 'asc' }],
  });
}

export async function recalcSlotCapacity(slotId: string) {
  const slot = await db.bookingSlot.findUnique({
    where: { id: slotId },
    include: { bookings: true },
  });

  if (!slot) return null;

  const reserved = slot.bookings
    .filter((booking) =>
      ['CONFIRMED', 'PENDING', 'MOVED'].includes(booking.status)
    )
    .reduce((sum, booking) => sum + booking.participantsCount, 0);

  return db.bookingSlot.update({
    where: { id: slotId },
    data: {
      capacityReserved: reserved,
      status: slot.isBlocked
        ? SlotStatus.BLOCKED
        : reserved >= slot.capacityMax
          ? SlotStatus.FULL
          : SlotStatus.AVAILABLE,
    },
  });
}

export async function blockSlot(slotId: string, reason?: string) {
  return db.bookingSlot.update({
    where: { id: slotId },
    data: {
      isBlocked: true,
      blockReason: reason ?? null,
      status: SlotStatus.BLOCKED,
    },
  });
}

export async function unblockSlot(slotId: string) {
  await db.bookingSlot.update({
    where: { id: slotId },
    data: {
      isBlocked: false,
      blockReason: null,
    },
  });

  return recalcSlotCapacity(slotId);
}