import { parseISO, isValid } from "date-fns";
import { authenticate } from "../shopify.server";
import { listSlotsByDate } from "../services/slot.server";

export async function loader({ request }: { request: Request }) {
  console.log("PROXY HIT:", request.url);

  try {
    const context = await authenticate.public.appProxy(request);
    console.log("PROXY AUTH OK");

    const url = new URL(request.url);

    const shop =
      url.searchParams.get("shop") ||
      context.session?.shop ||
      context.shop;

    const dateText = url.searchParams.get("date");

    console.log("PROXY PARAMS:", { shop, dateText });

    if (!shop || !dateText) {
      return Response.json(
        {
          ok: false,
          step: "validation",
          error: "shop ou date manquant",
          shop,
          dateText,
        },
        { status: 400 },
      );
    }

    const date = parseISO(dateText);

    if (!isValid(date)) {
      return Response.json(
        {
          ok: false,
          step: "validation",
          error: "date invalide",
          dateText,
        },
        { status: 400 },
      );
    }

    const slots = await listSlotsByDate(shop, date);

    console.log("PROXY SLOTS:", slots.length);

    return Response.json({
      ok: true,
      step: "success",
      shop,
      dateText,
      slotCount: slots.length,
      slots: slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacityMax: slot.capacityMax,
        capacityReserved: slot.capacityReserved,
        remaining: Math.max(0, slot.capacityMax - slot.capacityReserved),
        status: slot.status,
        isBlocked: slot.isBlocked,
      })),
    });
  } catch (error) {
    console.error("PROXY ERROR RAW:", error);

    if (error instanceof Response) {
      console.error("PROXY ERROR RESPONSE:", error.status, error.statusText);
      return Response.json(
        {
          ok: false,
          step: "catch-response",
          status: error.status,
          statusText: error.statusText,
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        ok: false,
        step: "catch",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    );
  }
}