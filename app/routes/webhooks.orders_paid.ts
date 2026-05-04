import { authenticate } from '../shopify.server';
import { db } from '../db.server';
import { createConfirmedBooking } from '../services/booking.server';

function propertyMap(properties: any[] = []) {
  return Object.fromEntries(properties.map((p) => [p.name, p.value]));
}

export async function action({ request }: any) {
  const { topic, shop, payload } = await authenticate.webhook(request);
  if (topic !== 'ORDERS_PAID') return new Response(null, { status: 200 });

  const shopRecord = await db.shop.upsert({
    where: { shopDomain: shop },
    update: {},
    create: { shopDomain: shop },
  });

  for (const item of payload.line_items || []) {
    const props = propertyMap(item.properties || []);
    if (!props._booking_date || !props._booking_start_time || !props._booking_slot_id) continue;

    const existing = await db.booking.findFirst({ where: { orderId: String(payload.id), slotId: String(props._booking_slot_id) } });
    if (existing) continue;

    await createConfirmedBooking({
      shopId: shopRecord.id,
      slotId: String(props._booking_slot_id),
      orderId: String(payload.id),
      orderName: payload.name,
      productHandle: props._booking_product_handle || 'visite-degustation',
      customerFirstName: props._booking_first_name || payload.customer?.first_name || '',
      customerLastName: props._booking_last_name || payload.customer?.last_name || '',
      customerEmail: props._booking_email || payload.email || '',
      customerPhone: props._booking_phone || payload.phone || '',
      participantsCount: Number(props._booking_participants || item.quantity || 1),
      customerComment: props._booking_comment || '',
    });
  }

  return new Response(null, { status: 200 });
}
