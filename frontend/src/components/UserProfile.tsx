'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import styles from './UserProfile.module.css';

export function UserProfile() {
  const { user, loading, isAuthenticated, signInWithGitHub, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ width: '90px', height: '34px', opacity: 0.5 }}></div>
      </div>
    );
  }

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.user_name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  const userAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  return (
    <div className={styles.container} ref={dropdownRef}>
      {!isAuthenticated ? (
        <>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={() => setIsModalOpen(true)}
            id="open-login-btn"
            data-testid="open-login-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Iniciar Sesión</span>
          </button>

          <AuthModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSignIn={signInWithGitHub}
          />
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.userMenuBtn}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            id="user-menu-btn"
            data-testid="user-menu-btn"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userDisplayName}
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.userName}>{userDisplayName}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown} data-testid="user-dropdown-menu">
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{userDisplayName}</p>
                {user?.email && <p className={styles.dropdownEmail}>{user.email}</p>}
              </div>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={async () => {
                  setIsDropdownOpen(false);
                  await signOut();
                }}
                id="logout-btn"
                data-testid="logout-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
