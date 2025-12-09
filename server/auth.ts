// Re-export auth functions from the new auth.ts config
// This file is kept for backward compatibility during migration
export { auth as getServerAuthSession } from "@/auth";
