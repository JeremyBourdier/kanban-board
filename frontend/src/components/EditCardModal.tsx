'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { KanbanCardItem } from '../types/kanban';
import styles from './AddCardModal.module.css';

interface EditCardModalProps {
  isOpen: boolean;
  card: KanbanCardItem | null;
  onClose: () => void;
  onSubmit: (cardId: string, title: string, details: string) => void;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({
  isOpen,
  card,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card && isOpen) {
      setTitle(card.title);
      setDetails(card.details || '');
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [card, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(card.id, trimmedTitle, details);
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      data-testid="edit-card-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="edit-card-modal"
      >
        <div className={styles.header}>
          <h2 id="edit-modal-title" className={styles.modalTitle}>
            Editar Tarjeta
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
            data-testid="edit-modal-close-button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="edit-card-title-input" className={styles.label}>
              Título de la Tarjeta <span className={styles.required}>*</span>
            </label>
            <input
              id="edit-card-title-input"
              ref={titleInputRef}
              type="text"
              className={styles.input}
              placeholder="e.g. Implementar funcionalidad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="edit-card-title-input"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-card-details-input" className={styles.label}>
              Detalles
            </label>
            <textarea
              id="edit-card-details-input"
              className={styles.textarea}
              placeholder="Descripción o notas de la tarea..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              data-testid="edit-card-details-input"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              data-testid="cancel-edit-card-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim()}
              data-testid="submit-edit-card-button"
            >
              <Check size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
