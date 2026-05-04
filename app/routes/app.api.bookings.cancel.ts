import { authenticate } from "../shopify.server";
import { cancelBooking } from "../services/booking.server";

export async function action({ request }: { request: Request }) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const bookingId = String(formData.get("bookingId") || "");

  if (!bookingId) {
    return Response.json({ ok: false, error: "bookingId manquant" }, { status: 400 });
  }

  const booking = await cancelBooking(bookingId);
  return Response.json({ ok: true, booking });
}
