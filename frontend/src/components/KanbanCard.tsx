'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical } from 'lucide-react';
import { KanbanCardItem } from '../types/kanban';
import styles from './KanbanCard.module.css';

interface KanbanCardProps {
  card: KanbanCardItem;
  index: number;
  onDelete: (cardId: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, index, onDelete }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${snapshot.isDragging ? styles.cardDragging : ''}`}
          data-testid={`kanban-card-${card.id}`}
        >
          <div className={styles.headerRow}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              title="Delete task"
              aria-label={`Delete task ${card.title}`}
              data-testid={`delete-card-${card.id}`}
            >
              <Trash2 size={15} />
            </button>
          </div>

          {card.details && <p className={styles.cardDetails}>{card.details}</p>}

          <div className={styles.footerRow}>
            <div className={styles.dragHandle} aria-hidden="true">
              <GripVertical size={13} />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
