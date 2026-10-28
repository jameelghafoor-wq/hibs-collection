import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema, type OrderInput } from "./schemas";

export type OrderResult =
  | {
      ok: true;
      orderNumber: string;
      subtotalMinor: number;
      shippingMinor: number;
      totalMinor: number;
      items: {
        name: string;
        sizeMl: number;
        qty: number;
        unitPriceMinor: number;
      }[];
    }
  | { ok: false; error: string };

/**
 * Order creation. Runs server-side only:
 *  - validates the payload shape (zod),
 *  - revalidates every price and stock quantity against the database,
 *  - creates the order atomically through a security-definer SQL function,
 *  - decrements stock only when enough is available.
 * Prices and shipping come from the database and server constants — the
 * client cart values are never trusted.
 */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): OrderInput => orderInputSchema.parse(input))
  .handler(async ({ data }): Promise<OrderResult> => {
    let supabaseAdmin;
    try {
      ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
    } catch {
      return { ok: false, error: "Order service is unavailable. Please retry." };
    }

    const { data: result, error } = await supabaseAdmin.rpc("create_order", {
      _customer: {
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        city: data.city,
        address: data.address,
        notes: data.notes ?? null,
      },
      _items: data.items.map((item) => ({
        variant_id: item.variantId,
        qty: item.qty,
      })),
    });

    if (error) {
      console.error("create_order rpc failed:", error.message);
      return {
        ok: false,
        error: "We couldn't place your order. Please review your cart and try again.",
      };
    }

    const payload = result as
      | {
          ok: true;
          order_number: string;
          subtotal_minor: number;
          shipping_minor: number;
          total_minor: number;
          items: { name: string; size_ml: number; qty: number; unit_price_minor: number }[];
        }
      | { ok: false; error: string };

    if (!payload || payload.ok !== true) {
      return {
        ok: false,
        error:
          (payload as { error?: string })?.error ??
          "Some items are no longer available. Please adjust your cart.",
      };
    }

    return {
      ok: true,
      orderNumber: payload.order_number,
      subtotalMinor: payload.subtotal_minor,
      shippingMinor: payload.shipping_minor,
      totalMinor: payload.total_minor,
      items: payload.items.map((i) => ({
        name: i.name,
        sizeMl: i.size_ml,
        qty: i.qty,
        unitPriceMinor: i.unit_price_minor,
      })),
    };
  });
