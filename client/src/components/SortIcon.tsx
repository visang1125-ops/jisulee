import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { SortField, SortDirection } from "@/lib/types";

interface SortIconProps {
  field: SortField;
  sortField: SortField | null;
  sortDirection: SortDirection;
}

/**
 * 정렬 아이콘 컴포넌트
 */
export default function SortIcon({ field, sortField, sortDirection }: SortIconProps) {
  if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
  if (sortDirection === "asc") return <ArrowUp className="h-4 w-4" />;
  return <ArrowDown className="h-4 w-4" />;
}

