import { customAlphabet } from "nanoid";

// Single source of truth for the urlId mint contract: the immutable, URL-safe
// id that becomes the canonical content resolver. Kept dependency-free (no db
// or next imports) so both the tRPC router and the backfill script can share it.
export const URL_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
export const URL_ID_LENGTH = 8;
export const mintUrlId = customAlphabet(URL_ID_ALPHABET, URL_ID_LENGTH);
