'use client';

import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './AccessDeniedHero.module.css';

export function AccessDeniedHero() {
  const { user, signOut } = useAuth();

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
    <div className={styles.deniedWrapper} data-testid="access-denied-container">
      <div className={styles.deniedCard}>
        <div className={styles.badge}>
          <span>Acceso Restringido</span>
        </div>

        <div className={styles.iconWrapper}>
          <ShieldAlert size={28} />
        </div>

        <h2 className={styles.title}>Cuenta No Autorizada</h2>
        <p className={styles.subtitle}>
          Este tablero Kanban es privado y solo está disponible para el propietario autorizado del proyecto.
        </p>

        <div className={styles.accountBox}>
          {userAvatar && (
            <img
              src={userAvatar}
              alt={userDisplayName}
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
          )}
          <div className={styles.accountInfo}>
            <span className={styles.accountName}>{userDisplayName}</span>
            {user?.email && <span className={styles.accountEmail}>{user.email}</span>}
          </div>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={signOut}
          id="access-denied-logout-btn"
          data-testid="access-denied-logout-btn"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión e Intentar con Otra Cuenta</span>
        </button>

        <p className={styles.footerNote}>
          Si crees que esto es un error, inicia sesión con la cuenta de GitHub propietaria.
        </p>
      </div>
    </div>
  );
}
