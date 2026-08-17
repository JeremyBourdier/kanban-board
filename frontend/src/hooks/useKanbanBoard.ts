import { useState, useCallback } from 'react';
import { KanbanBoardState, KanbanCardItem } from '../types/kanban';
import { initialBoardData } from '../data/initialData';

export function useKanbanBoard(initialData: KanbanBoardState = initialBoardData) {
  const [board, setBoard] = useState<KanbanBoardState>(initialData);

  const addCard = useCallback((columnId: string, title: string, details: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newCard: KanbanCardItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      details: details.trim(),
    };

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: [...col.cards, newCard],
          };
        }
        return col;
      }),
    }));
  }, []);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== cardId),
          };
        }
        return col;
      }),
    }));
  }, []);

  const renameColumn = useCallback((columnId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            title: trimmed,
          };
        }
        return col;
      }),
    }));
  }, []);

  const moveCard = useCallback(
    (
      sourceColumnId: string,
      destColumnId: string,
      sourceIndex: number,
      destIndex: number
    ) => {
      setBoard((prev) => {
        const sourceColIndex = prev.columns.findIndex((col) => col.id === sourceColumnId);
        const destColIndex = prev.columns.findIndex((col) => col.id === destColumnId);

        if (sourceColIndex === -1 || destColIndex === -1) return prev;

        const sourceCol = prev.columns[sourceColIndex];
        const destCol = prev.columns[destColIndex];

        // Moving within the same column
        if (sourceColumnId === destColumnId) {
          const newCards = Array.from(sourceCol.cards);
          const [movedCard] = newCards.splice(sourceIndex, 1);
          if (!movedCard) return prev;
          newCards.splice(destIndex, 0, movedCard);

          const newColumns = [...prev.columns];
          newColumns[sourceColIndex] = {
            ...sourceCol,
            cards: newCards,
          };

          return {
            ...prev,
            columns: newColumns,
          };
        }

        // Moving across different columns
        const sourceCards = Array.from(sourceCol.cards);
        const destCards = Array.from(destCol.cards);

        const [movedCard] = sourceCards.splice(sourceIndex, 1);
        if (!movedCard) return prev;
        destCards.splice(destIndex, 0, movedCard);

        const newColumns = [...prev.columns];
        newColumns[sourceColIndex] = {
          ...sourceCol,
          cards: sourceCards,
        };
        newColumns[destColIndex] = {
          ...destCol,
          cards: destCards,
        };

        return {
          ...prev,
          columns: newColumns,
        };
      });
    },
    []
  );

  return {
    board,
    addCard,
    deleteCard,
    renameColumn,
    moveCard,
  };
}
