import z from "zod";

/**
 * An http(s) URL string.
 *
 * `z.string().url()` validates URL *syntax* but accepts dangerous schemes such
 * as `javascript:` and `data:`, which become click-triggered XSS when rendered
 * into an `href`. Use this for any user-supplied URL that ends up in a link.
 */
export const httpUrl = () =>
  z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL must start with http:// or https://",
    });
