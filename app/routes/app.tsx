import { Outlet, useRouteError, isRouteErrorResponse } from "react-router";
import { AppProvider, Card, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

const polarisTranslations = {
  Polaris: {
    Common: {
      checkbox: "case à cocher",
    },
  },
};

export async function loader({ request }: { request: Request }) {
  await authenticate.admin(request);
  return null;
}

export default function AppLayout() {
  return (
    <AppProvider i18n={polarisTranslations}>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  let title = "Erreur";
  let message = "Une erreur est survenue dans l’application admin.";

  if (isRouteErrorResponse(error)) {
    title = `Erreur ${error.status}`;
    message =
      typeof error.data === "string"
        ? error.data
        : error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <AppProvider i18n={polarisTranslations}>
      <Page>
        <Card>
          <Text as="h1" variant="headingLg">
            {title}
          </Text>
          <div style={{ height: 12 }} />
          <Text as="p">{message}</Text>
        </Card>
      </Page>
    </AppProvider>
  );
}