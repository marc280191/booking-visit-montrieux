import { authenticate } from "../shopify.server";
import { blockSlot } from "../services/slot.server";

export async function action({ request }: { request: Request }) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const slotId = String(formData.get("slotId") || "");
  const reason = String(formData.get("reason") || "");

  if (!slotId) {
    return Response.json({ ok: false, error: "slotId manquant" }, { status: 400 });
  }

  await blockSlot(slotId, reason || undefined);

  return Response.json({ ok: true });
}