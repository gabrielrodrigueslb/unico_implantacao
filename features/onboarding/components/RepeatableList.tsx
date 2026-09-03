import type { ReactNode } from "react";
import { Plus, X } from "lucide-react";

export function RepeatableList<T extends { id: string }>({
  items,
  renderItem,
  onAdd,
  onRemove,
  addLabel,
  emptyLabel,
  addDisabled = false,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
  emptyLabel: string;
  addDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-soft px-4 py-8 text-center text-sm text-brand/40">
          {emptyLabel}
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border-soft bg-card p-4 sm:flex-row sm:items-start"
          >
            <div className="flex-1">{renderItem(item)}</div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex shrink-0 items-center gap-1 self-start text-xs font-medium text-red-500 hover:text-red-600 sm:self-center"
            >
              <X className="size-3.5" />
              Remover
            </button>
          </div>
        ))
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:border-border-soft disabled:text-brand/30 disabled:hover:bg-transparent"
      >
        <Plus className="size-4" />
        {addLabel}
      </button>
    </div>
  );
}
