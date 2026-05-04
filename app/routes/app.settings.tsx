import { Badge, BlockStack, Box, Card, List, Text } from "@shopify/polaris";
import { AdminShell } from "../components/AdminShell";

export default function SettingsPage() {
  return (
    <AdminShell
      title="Paramètres"
      subtitle="Repères rapides sur la configuration active du module de réservation."
    >
      <Card>
        <Box padding="400">
          <BlockStack gap="300">
            <Text as="p">
              Cette V2 est centrée sur l’exploitation mobile et bureau. Les réglages métier ci-dessous sont ceux actuellement utilisés.
            </Text>
            <List>
              <List.Item>Produit cible : <strong>visite-degustation</strong></List.Item>
              <List.Item>Capacité par défaut : <strong>15</strong></List.Item>
              <List.Item>Proxy storefront : <strong>/apps/montrieux-booking/availability</strong></List.Item>
              <List.Item>Jours gérés : jeudi, vendredi, samedi</List.Item>
            </List>
            <Box>
              <Badge tone="info">V2 admin active</Badge>
            </Box>
          </BlockStack>
        </Box>
      </Card>
    </AdminShell>
  );
}
