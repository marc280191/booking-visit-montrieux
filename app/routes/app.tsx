import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  useNavigate,
} from "react-router";
import type { HeadersFunction } from "react-router";
import { AppProvider, Card, Page, Text } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect } from "react";
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

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    if (isRouteErrorResponse(error) && error.status === 200) {
      navigate("/app", { replace: true });
    }
  }, [error, navigate]);

  if (isRouteErrorResponse(error) && error.status === 200) {
    return (
      <AppProvider i18n={polarisTranslations}>
        <Page>
          <Card>
            <Text as="p">Chargement de l’administration…</Text>
          </Card>
        </Page>
      </AppProvider>
    );
  }

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