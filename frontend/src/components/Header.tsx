'use client';

import React from 'react';
import { Kanban, Layers, CheckCircle2, Sun, Moon, MessageSquare } from 'lucide-react';
import { Theme } from '../hooks/useTheme';
import { UserProfile } from './UserProfile';
import styles from './Header.module.css';

interface HeaderProps {
  columnCount: number;
  totalCards: number;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  columnCount,
  totalCards,
  theme,
  onToggleTheme,
  onToggleChat,
}) => {
  return (
    <header className={styles.header} role="banner">
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <Kanban size={20} />
        </div>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Project Board</h1>
          <span className={styles.subtitle}>Kanban Task Flow</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.stats}>
          <div className={styles.statBadge} title="Total Active Columns">
            <Layers size={14} />
            <span>{columnCount} Columns</span>
          </div>
          <div className={`${styles.statBadge} ${styles.accentTag}`} title="Total Cards Across Board">
            <CheckCircle2 size={14} />
            <span>{totalCards} Tasks</span>
          </div>
        </div>

        {onToggleChat && (
          <button
            type="button"
            className={styles.themeToggle}
            onClick={onToggleChat}
            title="Abrir Asistente de Chat"
            aria-label="Abrir Asistente de Chat"
            data-testid="header-chat-button"
          >
            <MessageSquare size={18} />
          </button>
        )}

        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          data-testid="theme-toggle-button"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <UserProfile />
      </div>
    </header>
  );
};
