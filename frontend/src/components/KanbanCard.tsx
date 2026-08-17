'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, GripVertical, Pencil } from 'lucide-react';
import { KanbanCardItem } from '../types/kanban';
import styles from './KanbanCard.module.css';

interface KanbanCardProps {
  card: KanbanCardItem;
  index: number;
  onDelete: (cardId: string) => void;
  onEdit?: (card: KanbanCardItem) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ card, index, onDelete, onEdit }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${snapshot.isDragging ? styles.cardDragging : ''}`}
          data-testid={`kanban-card-${card.id}`}
          onDoubleClick={() => onEdit && onEdit(card)}
        >
          <div className={styles.headerRow}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <div className={styles.actions}>
              {onEdit && (
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(card);
                  }}
                  title="Editar tarjeta"
                  aria-label={`Editar tarjeta ${card.title}`}
                  data-testid={`edit-card-${card.id}`}
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                type="button"
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                }}
                title="Eliminar tarea"
                aria-label={`Eliminar tarea ${card.title}`}
                data-testid={`delete-card-${card.id}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
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
