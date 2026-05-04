import { BookingStatus, PaymentStatus } from '@prisma/client';
import { db } from '../db.server';
import { recalcSlotCapacity } from './slot.server';

export async function createConfirmedBooking(input: {
  shopId: string;
  slotId: string;
  orderId?: string;
  orderName?: string;
  productHandle?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  participantsCount: number;
  customerComment?: string;
}) {
  const booking = await db.booking.create({
    data: {
      ...input,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      events: {
        create: {
          eventType: 'PAYMENT_CONFIRMED',
          actor: 'shopify-webhook',
          newData: { orderId: input.orderId, orderName: input.orderName },
        },
      },
    },
  });

  await recalcSlotCapacity(input.slotId);
  return booking;
}

export async function moveBooking(bookingId: string, newSlotId: string, actor = 'admin') {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Réservation introuvable');

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: {
      slotId: newSlotId,
      status: BookingStatus.MOVED,
      events: {
        create: {
          eventType: 'MOVED',
          actor,
          previousData: { slotId: booking.slotId },
          newData: { slotId: newSlotId },
        },
      },
    },
  });

  await recalcSlotCapacity(booking.slotId);
  await recalcSlotCapacity(newSlotId);
  return updated;
}

export async function cancelBooking(bookingId: string, actor = 'admin') {
  const booking = await db.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      events: {
        create: {
          eventType: 'CANCELLED',
          actor,
        },
      },
    },
  });
  await recalcSlotCapacity(booking.slotId);
  return booking;
}
