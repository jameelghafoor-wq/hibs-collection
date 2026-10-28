import { z } from "zod";

export const orderInputSchema = z.object({
  fullName: z.string().trim().min(3, "Please enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Phone number contains invalid characters"),
  email: z.string().trim().email("Please enter a valid email").max(255),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  address: z.string().trim().min(10, "Please enter your complete delivery address").max(500),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your cart is empty")
    .max(20),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
