import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { ShopifyProvider, CartProvider } from "@shopify/hydrogen-react";

export async function loader({ context }: LoaderFunctionArgs) {
  return json({
    storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    storefrontToken: context.env.PUBLIC_STOREFRONT_API_TOKEN,
  });
}

export default function App() {
  const { storeDomain, storefrontToken } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ShopifyProvider
          storeDomain={`https://${storeDomain}`}
          storefrontToken={storefrontToken}
          storefrontApiVersion="2024-10"
          countryIsoCode="US"
          languageIsoCode="EN"
        >
          <CartProvider>
            <Outlet />
          </CartProvider>
        </ShopifyProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
