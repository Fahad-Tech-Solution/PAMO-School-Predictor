import type { UserRole } from "@/types";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
};
