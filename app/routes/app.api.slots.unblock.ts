import { authenticate } from "../shopify.server";
import { unblockSlot } from "../services/slot.server";

export async function action({ request }: { request: Request }) {
  await authenticate.admin(request);

  const formData = await request.formData();
  const slotId = String(formData.get("slotId") || "");

  if (!slotId) {
    return Response.json({ ok: false, error: "slotId manquant" }, { status: 400 });
  }

  await unblockSlot(slotId);

  return Response.json({ ok: true });
}