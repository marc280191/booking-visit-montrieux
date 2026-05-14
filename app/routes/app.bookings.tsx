import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useMemo, useState } from "react";
import { useFetcher, useLoaderData, useLocation } from "react-router";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";
import { AdminShell } from "../components/AdminShell";
import { EmbeddedNavLink } from "../components/EmbeddedNavLink";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop) {
    return {
      bookings: [],
      moveTargets: {} as Record<string, Array<{ label: string; value: string }>>,
    };
  }

  const bookings = await db.booking.findMany({
    where: { shopId: shop.id },
    include: { slot: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const allSlots = await db.bookingSlot.findMany({
    where: { shopId: shop.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const moveTargets: Record<string, Array<{ label: string; value: string }>> = {};

  for (const booking of bookings) {
    const availableSlots = allSlots.filter((slot) => {
      const sameSlot = slot.id === booking.slotId;
      const remaining = slot.capacityMax - slot.capacityReserved;
      return sameSlot || (!slot.isBlocked && remaining > 0);
    });

    moveTargets[booking.id] = availableSlots.map((slot) => ({
      value: slot.id,
      label: `${new Date(slot.date).toLocaleDateString("fr-FR")} · ${slot.startTime}–${slot.endTime} · ${slot.capacityReserved}/${slot.capacityMax}`,
    }));
  }

  return { bookings, moveTargets };
}

function AdminActionLink({
  to,
  children,
  dark = false,
}: {
  to: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <EmbeddedNavLink
      to={to}
      style={{
        display: "inline-block",
        padding: "10px 14px",
        borderRadius: "10px",
        textDecoration: "none",
        fontWeight: 600,
        background: dark ? "#111111" : "#f1f2f4",
        color: dark ? "#ffffff" : "#111111",
      }}
    >
      {children}
    </EmbeddedNavLink>
  );
}

export default function BookingsPage() {
  const { bookings, moveTargets } = useLoaderData<typeof loader>();

  const location = useLocation();
  const authSearch = location.search || "";

  const cancelFetcher = useFetcher();
  const moveFetcher = useFetcher();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedMoveSlots, setSelectedMoveSlots] = useState<Record<string, string>>({});

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const haystack = [
        booking.orderName,
        booking.customerFirstName,
        booking.customerLastName,
        booking.customerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" ? true : booking.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [bookings, query, status]);

  return (
    <AdminShell
      title="Réservations"
      subtitle="Recherche rapide, annulation et déplacement directement depuis l’admin."
      primaryAction={<AdminActionLink to="/app/slots">Voir les créneaux</AdminActionLink>}
    >
      <Card>
        <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
          <TextField
            label="Recherche"
            value={query}
            onChange={setQuery}
            autoComplete="off"
            placeholder="Nom, email, commande"
          />
          <Select
            label="Statut"
            options={[
              { label: "Tous", value: "ALL" },
              { label: "Confirmées", value: "CONFIRMED" },
              { label: "En attente", value: "PENDING" },
              { label: "Annulées", value: "CANCELLED" },
              { label: "Déplacées", value: "MOVED" },
            ]}
            value={status}
            onChange={setStatus}
          />
        </InlineGrid>
      </Card>

      <BlockStack gap="400">
        {filteredBookings.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              Aucune réservation ne correspond à vos filtres.
            </Text>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="start" wrap>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingLg">
                      {booking.customerFirstName} {booking.customerLastName}
                    </Text>
                    <Text as="p" tone="subdued">
                      {booking.orderName ?? "Sans numéro de commande"} · {booking.customerEmail}
                    </Text>
                  </BlockStack>

                  <InlineStack gap="200" wrap>
                    <Badge tone={booking.status === "CONFIRMED" ? "success" : "info"}>
                      {booking.status}
                    </Badge>
                    <Badge tone={booking.paymentStatus === "PAID" ? "success" : "attention"}>
                      {booking.paymentStatus}
                    </Badge>
                  </InlineStack>
                </InlineStack>

                <InlineGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="300">
                  <Box>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Créneau
                    </Text>
                    <Text as="p">
                      {new Date(booking.slot.date).toLocaleDateString("fr-FR")} ·{" "}
                      {booking.slot.startTime}–{booking.slot.endTime}
                    </Text>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Participants
                    </Text>
                    <Text as="p">{booking.participantsCount}</Text>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Téléphone
                    </Text>
                    <Text as="p">{booking.customerPhone || "—"}</Text>
                  </Box>

                  <Box>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Commentaire
                    </Text>
                    <Text as="p">{booking.customerComment || "—"}</Text>
                  </Box>
                </InlineGrid>

                <InlineGrid columns={{ xs: 1, lg: 2 }} gap="400">
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingMd">
                        Annuler la réservation
                      </Text>

                      <cancelFetcher.Form
                        method="post"
                        action={`/app/api/bookings/cancel${authSearch}`}
                      >
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <Button submit tone="critical">
                          Annuler la réservation
                        </Button>
                      </cancelFetcher.Form>
                    </BlockStack>
                  </Card>

                  <Card>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingMd">
                        Déplacer la réservation
                      </Text>

                      <Select
                        label="Déplacer vers"
                        options={moveTargets[booking.id] ?? []}
                        value={selectedMoveSlots[booking.id] ?? ""}
                        onChange={(value) =>
                          setSelectedMoveSlots((prev) => ({ ...prev, [booking.id]: value }))
                        }
                      />

                      <moveFetcher.Form
                        method="post"
                        action={`/app/api/bookings/move${authSearch}`}
                      >
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input
                          type="hidden"
                          name="newSlotId"
                          value={selectedMoveSlots[booking.id] ?? ""}
                        />
                        <Button submit disabled={!selectedMoveSlots[booking.id]} variant="primary">
                          Déplacer
                        </Button>
                      </moveFetcher.Form>
                    </BlockStack>
                  </Card>
                </InlineGrid>
              </BlockStack>
            </Card>
          ))
        )}
      </BlockStack>
    </AdminShell>
  );
}