'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import styles from './AddCardModal.module.css';

interface AddCardModalProps {
  isOpen: boolean;
  columnTitle: string;
  columnId: string;
  onClose: () => void;
  onSubmit: (columnId: string, title: string, details: string) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  columnTitle,
  columnId,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      titleInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    setTitle('');
    setDetails('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(columnId, trimmedTitle, details);
    setTitle('');
    setDetails('');
    onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleClose}
      data-testid="add-card-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="add-card-modal"
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.modalTitle}>
            Add Card to {columnTitle}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close modal"
            data-testid="modal-close-button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="card-title-input" className={styles.label}>
              Card Title <span className={styles.required}>*</span>
            </label>
            <input
              id="card-title-input"
              ref={titleInputRef}
              type="text"
              className={styles.input}
              placeholder="e.g. Implement payment gateway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="card-title-input"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="card-details-input" className={styles.label}>
              Details
            </label>
            <textarea
              id="card-details-input"
              className={styles.textarea}
              placeholder="Add optional task description or specifications..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              data-testid="card-details-input"
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              data-testid="cancel-add-card-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!title.trim()}
              data-testid="submit-add-card-button"
            >
              <Plus size={16} />
              <span>Add Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
