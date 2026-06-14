/**
 * Deterministic hue (0–359) from a string. Used for avatar / publication tints
 * so a given name or slug always maps to the same colour, on-site and in OG
 * images. Math.random would break that stability across renders.
 */
export const hueFromString = (value: string): number => {
  let sum = 0;
  for (let i = 0; i < value.length; i++) sum += value.charCodeAt(i);
  return sum % 360;
};
