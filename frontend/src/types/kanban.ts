export interface KanbanCardItem {
  id: string;
  title: string;
  details: string;
}

export interface KanbanColumnItem {
  id: string;
  title: string;
  cards: KanbanCardItem[];
}

export interface KanbanBoardState {
  columns: KanbanColumnItem[];
}
