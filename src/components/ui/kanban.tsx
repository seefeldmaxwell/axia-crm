"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface KanbanColumn<T> {
  id: string;
  title: string;
  items: T[];
  color?: string;
  wipLimit?: number;
}

interface KanbanProps<T> {
  columns: KanbanColumn<T>[];
  onDragEnd: (result: DropResult) => void;
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onAddClick?: (columnId: string) => void;
  className?: string;
  variant?: "palantir" | "azure";
}

export function Kanban<T>({
  columns,
  onDragEnd,
  renderCard,
  keyExtractor,
  onAddClick,
  className,
  variant = "palantir",
}: KanbanProps<T>) {
  const isAzure = variant === "azure";

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={cn("flex gap-3 overflow-x-auto pb-4 min-h-[500px]", className)}>
        {columns.map((col) => {
          const overWip = col.wipLimit ? col.items.length >= col.wipLimit : false;
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className="mb-2">
                {col.color && (
                  <div className="h-[2px] mb-2" style={{ backgroundColor: col.color, borderRadius: isAzure ? 0 : "2px 2px 0 0" }} />
                )}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-[13px] font-semibold"
                      style={{ color: isAzure ? "var(--ab-text)" : "var(--text-primary)" }}
                    >
                      {col.title}
                    </h3>
                    <span
                      className="text-[11px] px-1.5 py-0.5"
                      style={{
                        background: isAzure ? "var(--ab-header)" : "var(--bg-tertiary)",
                        color: overWip ? "var(--accent-red)" : (isAzure ? "var(--ab-text-secondary)" : "var(--text-secondary)"),
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {col.items.length}{col.wipLimit ? `/${col.wipLimit}` : ""}
                    </span>
                  </div>
                  {onAddClick && (
                    <button
                      onClick={() => onAddClick(col.id)}
                      className="p-1 transition-colors"
                      style={{
                        color: isAzure ? "var(--ab-text-secondary)" : "var(--text-tertiary)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[400px] p-1.5 transition-colors"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: snapshot.isDraggingOver
                        ? (isAzure ? "rgba(0,120,212,0.08)" : "var(--accent-blue-muted)")
                        : (isAzure ? "transparent" : "rgba(0,0,0,0.15)"),
                    }}
                  >
                    {col.items.map((item, index) => (
                      <Draggable
                        key={keyExtractor(item)}
                        draggableId={keyExtractor(item)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn("mb-1.5", snapshot.isDragging && "shadow-lg")}
                          >
                            {renderCard(item, index)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
