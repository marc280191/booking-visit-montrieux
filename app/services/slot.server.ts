import { SlotStatus } from '@prisma/client';
import { addDays, format, startOfDay } from 'date-fns';
import { db } from '../db.server';
import { DEFAULT_CAPACITY } from '../utils/constants';

const weeklySlots: Record<number, Array<[string, string]>> = {
  4: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  5: [['11:00', '12:00'], ['16:00', '17:00'], ['17:00', '18:00']],
  6: [['11:00', '12:00'], ['14:00', '15:00'], ['16:00', '17:00'], ['17:00', '18:00']],
};

function getCurrentTimeText() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function isSlotPast(slot: { date: Date; endTime: string }) {
  const today = startOfDay(new Date());
  const slotDate = startOfDay(slot.date);

  if (slotDate < today) return true;
  if (slotDate > today) return false;

  return slot.endTime <= getCurrentTimeText();
}

export function isSlotFutureOrCurrent(slot: { date: Date; endTime: string }) {
  return !isSlotPast(slot);
}

export async function getOrCreateShop(shopDomain: string) {
  return db.shop.upsert({
    where: { shopDomain },
    update: {},
    create: { shopDomain },
  });
}

export async function cleanupPastEmptySlots(shopId: string) {
  const today = startOfDay(new Date());
  const currentTime = getCurrentTimeText();

  const pastEmptySlots = await db.bookingSlot.findMany({
    where: {
      shopId,
      bookings: {
        none: {},
      },
      OR: [
        {
          date: {
            lt: today,
          },
        },
        {
          date: today,
          endTime: {
            lte: currentTime,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (pastEmptySlots.length === 0) {
    return { deletedCount: 0 };
  }

  const result = await db.bookingSlot.deleteMany({
    where: {
      id: {
        in: pastEmptySlots.map((slot) => slot.id),
      },
    },
  });

  return { deletedCount: result.count };
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

  await cleanupPastEmptySlots(shop.id);

  return shop;
}

export async function listSlotsByDate(shopDomain: string, date: Date) {
  const shop = await getOrCreateShop(shopDomain);
  const requestedDate = startOfDay(date);

  const slots = await db.bookingSlot.findMany({
    where: {
      shopId: shop.id,
      date: requestedDate,
    },
    orderBy: [{ startTime: 'asc' }],
  });

  return slots.filter(isSlotFutureOrCurrent);
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