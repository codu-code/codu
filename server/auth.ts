// Re-export auth functions from the new auth.ts config
// This file is kept for backward compatibility during migration
import { cache } from "react";
import { auth } from "@/auth";

// Database-session lookups run per auth() call; React cache() dedupes the
// layout/metadata/page calls within one request (no-op outside RSC renders).
export const getServerAuthSession = cache(() => auth());
