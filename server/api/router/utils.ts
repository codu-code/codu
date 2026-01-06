import type { AnyColumn } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const increment = (column: AnyColumn, value = 1) => {
  return sql`${column} + ${value}`;
};

export const decrement = (column: AnyColumn, value = 1) => {
  return sql`${column} - ${value}`;
};
