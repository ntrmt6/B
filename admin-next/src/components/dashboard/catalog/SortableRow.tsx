import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
}

export function SortableRow({ id, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative',
    backgroundColor: isDragging ? '#f0f9ff' : undefined,
  };
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`h-[68px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <td className="px-2 py-3 w-[40px]">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </td>
      {children}
    </tr>
  );
}
