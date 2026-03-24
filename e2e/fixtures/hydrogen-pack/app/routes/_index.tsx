import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { useCart } from "@shopify/hydrogen-react";
import { useEffect, useState } from "react";
import {
  RedoProvider,
  RedoInfoCard,
  RedoCheckoutButtons,
  useRedoCoverageClient,
} from "@redotech/redo-hydrogen";

export async function loader({ context }: LoaderFunctionArgs) {
  const { storefront } = context;
  const productHandle = context.env.PUBLIC_TEST_PRODUCT_HANDLE;
  const redoStoreId = context.env.PUBLIC_REDO_STORE_ID;

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle: productHandle },
  });

  return json({ product, redoStoreId });
}

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      variants(first: 1) {
        nodes {
          id
          title
          price {
            amount
            currencyCode
          }
          availableForSale
        }
      }
    }
  }
` as const;

function AddToCartButton({ variantId }: { variantId: string }) {
  const { linesAdd, status } = useCart();

  const handleAddToCart = () => {
    linesAdd([{ merchandiseId: variantId, quantity: 1 }]);
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={status !== "idle" && status !== "uninitialized"}
      data-testid="add-to-cart"
    >
      {status === "creating" || status === "updating" ? "Adding..." : "Add to Cart"}
    </button>
  );
}

function RedoSection() {
  const client = useRedoCoverageClient();

  return (
    <div data-testid="redo-section">
      <div data-testid="redo-loading" data-loading={client.loading}>
        {client.loading ? "Loading Redo..." : "Redo loaded"}
      </div>
      <div data-testid="redo-eligible" data-eligible={client.eligible}>
        {client.eligible ? "Eligible" : "Not eligible"}
      </div>
      {client.price !== undefined && (
        <div data-testid="redo-price">{client.price}</div>
      )}
      {client.errors && client.errors.length > 0 && (
        <div data-testid="redo-errors">
          {client.errors.map((e, i) => (
            <div key={i} data-testid="redo-error" data-error-type={e.type}>
              {e.message}
            </div>
          ))}
        </div>
      )}
      <RedoInfoCard />
      <RedoCheckoutButtons>
        <a href="/checkout" data-testid="fallback-checkout">
          Checkout
        </a>
      </RedoCheckoutButtons>
    </div>
  );
}

function CartContents() {
  const cart = useCart();

  if (!cart.lines || cart.lines.length === 0) return null;

  return (
    <>
      <div data-testid="cart-lines">
        {cart.lines.map((line) => (
          <div
            key={line.id}
            data-testid="cart-line"
            data-vendor={line.merchandise?.product?.vendor}
            data-variant-id={line.merchandise?.id}
          >
            <span data-testid="cart-line-title">
              {line.merchandise?.product?.title}
            </span>
            <span data-testid="cart-line-vendor">
              {line.merchandise?.product?.vendor}
            </span>
            <span data-testid="cart-line-quantity">{line.quantity}</span>
          </div>
        ))}
      </div>
      {cart.attributes && cart.attributes.length > 0 && (
        <div data-testid="cart-attributes">
          {cart.attributes.map((attr) => (
            <div
              key={attr.key}
              data-testid="cart-attribute"
              data-attribute-key={attr.key}
              data-attribute-value={attr.value}
            >
              {attr.key}: {attr.value}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function PackCartRedoWrapper({ redoStoreId }: { redoStoreId: string }) {
  const cart = useCart();
  const [hasItems, setHasItems] = useState(false);

  useEffect(() => {
    if (cart.lines && cart.lines.length > 0 && cart.status === "idle") {
      setHasItems(true);
    }
  }, [cart.lines, cart.status]);

  if (!hasItems) {
    return <div data-testid="no-cart">No cart yet. Add an item first.</div>;
  }

  return (
    <RedoProvider cart={cart} storeId={redoStoreId}>
      <RedoSection />
    </RedoProvider>
  );
}

export default function Index() {
  const { product, redoStoreId } = useLoaderData<typeof loader>();

  if (!product) {
    return <div>Product not found. Check PUBLIC_TEST_PRODUCT_HANDLE.</div>;
  }

  const firstVariant = product.variants.nodes[0];

  return (
    <div data-testid="product-page">
      <h1 data-testid="product-title">{product.title}</h1>
      <p data-testid="product-price">
        ${firstVariant.price.amount} {firstVariant.price.currencyCode}
      </p>

      <AddToCartButton variantId={firstVariant.id} />

      <CartContents />
      <PackCartRedoWrapper redoStoreId={redoStoreId} />
    </div>
  );
}
