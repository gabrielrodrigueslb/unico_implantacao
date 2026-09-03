import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "../status";
import type { ImplantationStatus } from "../types";

export function StatusBadge({ status }: { status: ImplantationStatus }) {
  return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
