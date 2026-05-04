import {
  Badge,
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { useLoaderData } from "react-router";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";
import { AdminShell } from "../components/AdminShell";
import { EmbeddedNavLink } from "../components/EmbeddedNavLink";

export async function loader({ request }: { request: Request }) {
  const { session } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      bookings: {
        where: {
          status: {
            in: ["CONFIRMED", "PENDING"],
          },
        },
        include: {
          slot: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
      slots: true,
    },
  });

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const bookingsToday =
    shop?.bookings.filter(
      (booking) => booking.slot.date.toISOString().slice(0, 10) === todayKey,
    ) ?? [];

  const participantsToday = bookingsToday.reduce(
    (sum, booking) => sum + booking.participantsCount,
    0,
  );

  const fullSlots = shop?.slots.filter((slot) => slot.status === "FULL").length ?? 0;
  const blockedSlots = shop?.slots.filter((slot) => slot.isBlocked).length ?? 0;

  return {
    bookingsTodayCount: bookingsToday.length,
    participantsToday,
    fullSlots,
    blockedSlots,
    upcomingBookings: shop?.bookings ?? [],
  };
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

export default function DashboardPage() {
  const {
    bookingsTodayCount,
    participantsToday,
    fullSlots,
    blockedSlots,
    upcomingBookings,
  } = useLoaderData<typeof loader>();

  return (
    <AdminShell
      title="Administration des réservations"
      subtitle="Vue rapide pensée pour piloter les visites en temps réel depuis ordinateur ou mobile."
      primaryAction={
        <AdminActionLink to="/app/bookings" dark>
          Ouvrir les réservations
        </AdminActionLink>
      }
    >
      <InlineGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="400">
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Réservations du jour
            </Text>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="heading2xl">
                {bookingsTodayCount}
              </Text>
              <Badge tone="success">Live</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Participants du jour
            </Text>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="heading2xl">
                {participantsToday}
              </Text>
              <Badge tone="info">Live</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Créneaux complets
            </Text>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="heading2xl">
                {fullSlots}
              </Text>
              <Badge tone="warning">Live</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Créneaux bloqués
            </Text>
            <InlineStack align="space-between" blockAlign="center">
              <Text as="p" variant="heading2xl">
                {blockedSlots}
              </Text>
              <Badge tone="critical">Live</Badge>
            </InlineStack>
          </BlockStack>
        </Card>
      </InlineGrid>

      <InlineGrid columns={{ xs: 1, lg: 2 }} gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingLg">
                Prochaines réservations
              </Text>
              <AdminActionLink to="/app/bookings">Tout voir</AdminActionLink>
            </InlineStack>

            {upcomingBookings.length === 0 ? (
              <Text as="p" tone="subdued">
                Aucune réservation pour le moment.
              </Text>
            ) : (
              <BlockStack gap="300">
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <Card key={booking.id}>
                    <BlockStack gap="150">
                      <InlineStack align="space-between" wrap>
                        <Text as="p" variant="headingMd">
                          {booking.customerFirstName} {booking.customerLastName}
                        </Text>
                        <Badge tone="success">{booking.paymentStatus}</Badge>
                      </InlineStack>
                      <Text as="p" tone="subdued">
                        {new Date(booking.slot.date).toLocaleDateString("fr-FR")} ·{" "}
                        {booking.slot.startTime} · {booking.participantsCount} pers.
                      </Text>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingLg">
                Créneaux
              </Text>
              <AdminActionLink to="/app/slots">Gérer</AdminActionLink>
            </InlineStack>

            <Text as="p" tone="subdued">
              Suivi des capacités, blocage et déblocage des créneaux.
            </Text>
          </BlockStack>
        </Card>
      </InlineGrid>
    </AdminShell>
  );
}