import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  Select,
  Text,
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
    return { slots: [] };
  }

  const slots = await db.bookingSlot.findMany({
    where: { shopId: shop.id },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 60,
  });

  return { slots };
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

export default function SlotsPage() {
  const { slots } = useLoaderData<typeof loader>();
  const location = useLocation();
  const blockFetcher = useFetcher();
  const unblockFetcher = useFetcher();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const blockAction = `/app/api/slots/block${location.search}`;
  const unblockAction = `/app/api/slots/unblock${location.search}`;

  const filteredSlots = useMemo(() => {
    if (statusFilter === "ALL") return slots;
    if (statusFilter === "BLOCKED") return slots.filter((slot) => slot.isBlocked);
    if (statusFilter === "FULL") return slots.filter((slot) => slot.status === "FULL");
    if (statusFilter === "AVAILABLE") {
      return slots.filter((slot) => !slot.isBlocked && slot.status === "AVAILABLE");
    }
    return slots;
  }, [slots, statusFilter]);

  return (
    <AdminShell
      title="Créneaux"
      subtitle="Vue stable des capacités et disponibilités, avec blocage manuel."
      primaryAction={<AdminActionLink to="/app/bookings">Voir les réservations</AdminActionLink>}
    >
      <Card>
        <Select
          label="Filtrer les créneaux"
          options={[
            { label: "Tous", value: "ALL" },
            { label: "Disponibles", value: "AVAILABLE" },
            { label: "Complets", value: "FULL" },
            { label: "Bloqués", value: "BLOCKED" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </Card>

      <BlockStack gap="400">
        {filteredSlots.length === 0 ? (
          <Card>
            <Text as="p" tone="subdued">
              Aucun créneau disponible.
            </Text>
          </Card>
        ) : (
          filteredSlots.map((slot) => {
            const remaining = Math.max(0, slot.capacityMax - slot.capacityReserved);

            return (
              <Card key={slot.id}>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    {new Date(slot.date).toLocaleDateString("fr-FR")} · {slot.startTime}–{slot.endTime}
                  </Text>

                  <InlineGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="300">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Réservé
                      </Text>
                      <Text as="p">
                        {slot.capacityReserved}/{slot.capacityMax}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Restant
                      </Text>
                      <Text as="p">{remaining}</Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Bloqué
                      </Text>
                      <Text as="p">{slot.isBlocked ? "Oui" : "Non"}</Text>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodySm" tone="subdued">
                        Statut
                      </Text>
                      <Badge
                        tone={
                          slot.isBlocked
                            ? "critical"
                            : slot.status === "FULL"
                            ? "warning"
                            : "success"
                        }
                      >
                        {slot.isBlocked ? "BLOCKED" : slot.status}
                      </Badge>
                    </BlockStack>
                  </InlineGrid>

                  {slot.isBlocked ? (
                    <unblockFetcher.Form method="post" action={unblockAction}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <Button submit variant="primary">
                        Débloquer le créneau
                      </Button>
                    </unblockFetcher.Form>
                  ) : (
                    <BlockStack gap="200">
                      <Select
                        label="Motif de blocage"
                        options={[
                          { label: "Privatisation", value: "Privatisation" },
                          { label: "Équipe indisponible", value: "Équipe indisponible" },
                          { label: "Maintenance", value: "Maintenance" },
                          { label: "Autre", value: "Autre" },
                        ]}
                        value={reasons[slot.id] ?? "Privatisation"}
                        onChange={(value) =>
                          setReasons((prev) => ({ ...prev, [slot.id]: value }))
                        }
                      />

                      <blockFetcher.Form method="post" action={blockAction}>
                        <input type="hidden" name="slotId" value={slot.id} />
                        <input
                          type="hidden"
                          name="reason"
                          value={reasons[slot.id] ?? "Privatisation"}
                        />
                        <Button submit tone="critical">
                          Bloquer le créneau
                        </Button>
                      </blockFetcher.Form>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            );
          })
        )}
      </BlockStack>
    </AdminShell>
  );
}