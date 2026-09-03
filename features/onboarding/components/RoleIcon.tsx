import { Eye, Headset, ShieldCheck } from "lucide-react";
import type { UserRole } from "../types";

const ROLE_ICONS: Record<UserRole, typeof Eye> = {
  administrador: ShieldCheck,
  supervisor: Eye,
  atendente: Headset,
};

export function RoleIcon({ role, className = "size-4" }: { role: UserRole; className?: string }) {
  const Icon = ROLE_ICONS[role];
  return <Icon className={className} />;
}
