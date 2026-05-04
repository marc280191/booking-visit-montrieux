import { authenticate } from "../shopify.server";
import { moveBooking } from "../services/booking.server";

export async function action({ request }: { request: Request }) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") || "");
  const newSlotId = String(formData.get("newSlotId") || "");

  if (!bookingId || !newSlotId) {
    return Response.json({ ok: false, error: "Paramètres manquants" }, { status: 400 });
  }

  const booking = await moveBooking(bookingId, newSlotId);
  return Response.json({ ok: true, booking });
}
