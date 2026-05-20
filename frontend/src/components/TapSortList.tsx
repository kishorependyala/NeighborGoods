import React, { useState, useRef } from 'react';

interface SortableItem {
  id: string;
  label: string;
}

export function TapSortList({
  items,
  onChange,
}: {
  items: SortableItem[];
  onChange: (newItems: SortableItem[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const move = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    const next = [...items];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    onChange(next);
  };

  const moveSelected = (delta: number) => {
    if (!selectedId) return;
    const idx = items.findIndex(i => i.id === selectedId);
    move(idx, idx + delta);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== index) {
      move(dragIndex.current, index);
    }
    dragIndex.current = null;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button
          onMouseDown={e => {
            e.preventDefault();
            moveSelected(-1);
          }}
          onTouchEnd={e => {
            e.preventDefault();
            moveSelected(-1);
          }}
          disabled={!selectedId}
          style={{ width: 44, height: 44, fontSize: 20 }}
        >
          ↑
        </button>
        <button
          onMouseDown={e => {
            e.preventDefault();
            moveSelected(1);
          }}
          onTouchEnd={e => {
            e.preventDefault();
            moveSelected(1);
          }}
          disabled={!selectedId}
          style={{ width: 44, height: 44, fontSize: 20 }}
        >
          ↓
        </button>
        {selectedId && (
          <>
            <button
              onMouseDown={e => {
                e.preventDefault();
                const idx = items.findIndex(i => i.id === selectedId);
                move(idx, 0);
              }}
              onTouchEnd={e => {
                e.preventDefault();
                const idx = items.findIndex(i => i.id === selectedId);
                move(idx, 0);
              }}
              style={{ height: 44, fontSize: 14 }}
            >
              ⤒ Top
            </button>
            <button
              onMouseDown={e => {
                e.preventDefault();
                const idx = items.findIndex(i => i.id === selectedId);
                move(idx, items.length - 1);
              }}
              onTouchEnd={e => {
                e.preventDefault();
                const idx = items.findIndex(i => i.id === selectedId);
                move(idx, items.length - 1);
              }}
              style={{ height: 44, fontSize: 14 }}
            >
              ⤓ Bot
            </button>
          </>
        )}
      </div>

      {items.map((item, idx) => {
        const isSelected = item.id === selectedId;
        return (
          <div
            key={item.id}
            draggable
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, idx)}
            onClick={() => setSelectedId(isSelected ? null : item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              marginBottom: 6,
              borderRadius: 8,
              background: isSelected ? '#fef3c7' : '#fff',
              border: isSelected ? '2px solid #f59e0b' : '1px solid #e5e7eb',
              cursor: 'pointer',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: 20, cursor: 'grab' }}>⠿</span>
            <span style={{ color: '#6b7280', fontSize: 20, minWidth: 24, fontWeight: 600 }}>{idx + 1}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {isSelected && <span style={{ color: '#f59e0b' }}>← selected</span>}
          </div>
        );
      })}
    </div>
  );
}

export default TapSortList;
