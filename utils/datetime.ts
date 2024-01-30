/**
 * Ref: https://dev.to/kevinluo201/set-value-of-datetime-local-input-field-3435
 */
export function dateToLocalDatetimeStr(date: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
