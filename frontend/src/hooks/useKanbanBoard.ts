import { useState, useCallback, useEffect, useRef } from 'react';
import { KanbanBoardState, KanbanCardItem } from '../types/kanban';
import { initialBoardData } from '../data/initialData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useKanbanBoard(initialData: KanbanBoardState = initialBoardData) {
  const [board, setBoard] = useState<KanbanBoardState>(initialData);
  const isSyncingRef = useRef(false);

  // Sync state to backend API
  const persistBoard = useCallback(async (updatedBoard: KanbanBoardState) => {
    try {
      isSyncingRef.current = true;
      await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBoard),
      });
    } catch (err) {
      console.error('Failed to sync board:', err);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 600);
    }
  }, []);

  // Fetch initial board state
  useEffect(() => {
    let isMounted = true;

    const fetchLatestBoard = async () => {
      if (isSyncingRef.current) return;
      try {
        const res = await fetch('/api/board', { cache: 'no-store' });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && Array.isArray(data.columns) && data.columns.length > 0) {
            setBoard((current) => {
              if (JSON.stringify(current) !== JSON.stringify(data)) {
                return data;
              }
              return current;
            });
          }
        }
      } catch (err) {
        // silent fallback to current state
      }
    };

    fetchLatestBoard();

    // Setup Supabase Realtime subscription if configured
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('kanban_realtime_board')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'kanban_board' },
          (payload) => {
            if (isSyncingRef.current) return;
            const newData = (payload.new as { data?: KanbanBoardState })?.data;
            if (newData && Array.isArray(newData.columns) && newData.columns.length > 0) {
              setBoard((current) => {
                if (JSON.stringify(current) !== JSON.stringify(newData)) {
                  return newData;
                }
                return current;
              });
            }
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        if (supabase) {
          supabase.removeChannel(channel);
        }
      };
    } else {
      // Fallback to lightweight polling when Supabase is offline / local
      const interval = setInterval(fetchLatestBoard, 1500);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, []);

  const addCard = useCallback((columnId: string, title: string, details: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newCard: KanbanCardItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      details: details.trim(),
    };

    setBoard((prev) => {
      const updated: KanbanBoardState = {
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
      };
      persistBoard(updated);
      return updated;
    });
  }, [persistBoard]);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    setBoard((prev) => {
      const updated: KanbanBoardState = {
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
      };
      persistBoard(updated);
      return updated;
    });
  }, [persistBoard]);

  const renameColumn = useCallback((columnId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setBoard((prev) => {
      const updated: KanbanBoardState = {
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
      };
      persistBoard(updated);
      return updated;
    });
  }, [persistBoard]);

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

          const updated = {
            ...prev,
            columns: newColumns,
          };
          persistBoard(updated);
          return updated;
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

        const updated = {
          ...prev,
          columns: newColumns,
        };
        persistBoard(updated);
        return updated;
      });
    },
    [persistBoard]
  );

  return {
    board,
    addCard,
    deleteCard,
    renameColumn,
    moveCard,
  };
}
