'use client';

import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useKanbanBoard } from '../hooks/useKanbanBoard';
import { useTheme } from '../hooks/useTheme';
import { useIsMounted } from '../hooks/useIsMounted';
import { useAuth } from '../hooks/useAuth';
import { Header } from './Header';
import { KanbanColumn } from './KanbanColumn';
import { AddCardModal } from './AddCardModal';
import { LoginHero } from './LoginHero';
import styles from './KanbanBoard.module.css';

export const KanbanBoard: React.FC = () => {
  const isMounted = useIsMounted();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
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

  if (!isMounted || authLoading) {
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
            {/* Loading Skeleton */}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.boardLayout}>
      <Header
        columnCount={board.columns.length}
        totalCards={isAuthenticated ? totalCards : 0}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={styles.mainContent}>
        {!isAuthenticated ? (
          <LoginHero />
        ) : (
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
        )}
      </main>

      {isAuthenticated && (
        <AddCardModal
          isOpen={!!activeModalCol}
          columnId={activeModalCol?.id || ''}
          columnTitle={activeModalCol?.title || ''}
          onClose={handleCloseAddCardModal}
          onSubmit={addCard}
        />
      )}
    </div>
  );
};
