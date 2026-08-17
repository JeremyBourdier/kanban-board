'use client';

import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { useTheme } from '../hooks/useTheme';
import { useIsMounted } from '../hooks/useIsMounted';
import { Header } from './Header';
import { KanbanColumn } from './KanbanColumn';
import { AddCardModal } from './AddCardModal';
import styles from './KanbanBoard.module.css';

export const KanbanBoard: React.FC = () => {
  const isMounted = useIsMounted();
  const { board, addCard, deleteCard, renameColumn, moveCard } = useKanbanBoard();
  const { theme, toggleTheme } = useTheme();

  const [activeModalCol, setActiveModalCol] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const totalCards = board.columns.reduce((acc, col) => acc + col.cards.length, 0);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Dropped outside a valid drop target
    if (!destination) return;

    // Dropped in exact same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveCard(
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
  };

  const handleOpenAddCardModal = (columnId: string, columnTitle: string) => {
    setActiveModalCol({ id: columnId, title: columnTitle });
  };

  const handleCloseAddCardModal = () => {
    setActiveModalCol(null);
  };

  if (!isMounted) {
    return (
      <div className={styles.boardLayout}>
        <Header
          columnCount={5}
          totalCards={0}
          theme="light"
          onToggleTheme={() => {}}
        />
        <main className={styles.mainContent}>
          <div className={styles.boardContainer}>
            {/* Render placeholder skeleton for server pass */}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.boardLayout}>
      <Header
        columnCount={board.columns.length}
        totalCards={totalCards}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={styles.mainContent}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={styles.boardContainer} data-testid="kanban-board-container">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onRename={renameColumn}
                onDeleteCard={deleteCard}
                onOpenAddCardModal={handleOpenAddCardModal}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      <AddCardModal
        isOpen={!!activeModalCol}
        columnId={activeModalCol?.id || ''}
        columnTitle={activeModalCol?.title || ''}
        onClose={handleCloseAddCardModal}
        onSubmit={addCard}
      />
    </div>
  );
};
