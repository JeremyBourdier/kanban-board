'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, Edit2 } from 'lucide-react';
import { KanbanColumnItem, KanbanCardItem } from '../types/kanban';
import { KanbanCard } from './KanbanCard';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  column: KanbanColumnItem;
  onRename: (columnId: string, newTitle: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onEditCard: (card: KanbanCardItem) => void;
  onOpenAddCardModal: (columnId: string, columnTitle: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onRename,
  onDeleteCard,
  onEditCard,
  onOpenAddCardModal,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleStartEditing = () => {
    setTitleValue(column.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== column.title) {
      onRename(column.id, trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  return (
    <section
      className={styles.column}
      data-testid={`kanban-column-${column.id}`}
      aria-label={`Column: ${column.title}`}
    >
      <div className={styles.columnHeader}>
        <div className={styles.titleArea}>
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              className={styles.titleInput}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              aria-label="Edit column title"
              data-testid={`column-title-input-${column.id}`}
            />
          ) : (
            <div
              className={styles.titleWrapper}
              onClick={handleStartEditing}
              title="Click to rename column"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartEditing();
                }
              }}
              data-testid={`column-title-trigger-${column.id}`}
            >
              <h2 className={styles.columnTitle} data-testid={`column-title-${column.id}`}>
                {column.title}
              </h2>
              <Edit2 size={13} className={styles.editIcon} />
            </div>
          )}
        </div>
        <span
          className={styles.countBadge}
          title={`${column.cards.length} cards`}
          data-testid={`column-count-${column.id}`}
        >
          {column.cards.length}
        </span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.cardsContainer} ${
              snapshot.isDraggingOver ? styles.cardsContainerDraggingOver : ''
            }`}
            data-testid={`column-cards-container-${column.id}`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                onDelete={(cardId) => onDeleteCard(column.id, cardId)}
                onEdit={onEditCard}
              />
            ))}
            {provided.placeholder}
            {column.cards.length === 0 && !snapshot.isDraggingOver && (
              <div className={styles.emptyState}>No tasks in this column</div>
            )}
          </div>
        )}
      </Droppable>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.addCardButton}
          onClick={() => onOpenAddCardModal(column.id, column.title)}
          data-testid={`add-card-button-${column.id}`}
        >
          <Plus size={15} />
          <span>Add Card</span>
        </button>
      </div>
    </section>
  );
};
