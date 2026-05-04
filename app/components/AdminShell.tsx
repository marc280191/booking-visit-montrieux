import {
  Badge,
  BlockStack,
  Box,
  Card,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { EmbeddedNavLink } from "./EmbeddedNavLink";

const navItems = [
  { label: "Tableau de bord", to: "/app" },
  { label: "Réservations", to: "/app/bookings" },
  { label: "Créneaux", to: "/app/slots" },
];

export function AdminShell({
  title,
  subtitle,
  children,
  primaryAction,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  primaryAction?: ReactNode;
}) {
  const location = useLocation();

  return (
    <Page>
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="start" gap="300" wrap>
              <BlockStack gap="100">
                <InlineStack gap="200" blockAlign="center" wrap>
                  <Text as="h1" variant="headingXl">
                    {title}
                  </Text>
                  <Badge tone="info">Admin stable</Badge>
                </InlineStack>
                {subtitle ? (
                  <Text as="p" tone="subdued">
                    {subtitle}
                  </Text>
                ) : null}
              </BlockStack>
              {primaryAction ? <Box>{primaryAction}</Box> : null}
            </InlineStack>

            <InlineStack gap="200" wrap>
              {navItems.map((item) => {
                const active =
                  item.to === "/app"
                    ? location.pathname === "/app" || location.pathname === "/app/"
                    : location.pathname.startsWith(item.to);

                return (
                  <EmbeddedNavLink
                    key={item.to}
                    to={item.to}
                    style={{
                      display: "inline-block",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      textDecoration: "none",
                      fontWeight: 600,
                      background: active ? "#111111" : "#f1f2f4",
                      color: active ? "#ffffff" : "#111111",
                    }}
                  >
                    {item.label}
                  </EmbeddedNavLink>
                );
              })}
            </InlineStack>
          </BlockStack>
        </Card>

        {children}
      </BlockStack>
    </Page>
  );
}