'use client';

import React, { useState } from 'react';
import { Kanban, ShieldCheck, Zap, Columns } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './LoginHero.module.css';

export function LoginHero() {
  const { signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInWithGitHub();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión con GitHub.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.heroWrapper} data-testid="login-hero-container">
      <div className={styles.heroCard}>
        <div className={styles.badge}>
          <span>Acceso Privado</span>
        </div>

        <div className={styles.iconWrapper}>
          <Kanban size={28} />
        </div>

        <h2 className={styles.title}>Project Board</h2>
        <p className={styles.subtitle}>
          Inicia sesión con tu cuenta de GitHub para acceder a tu tablero Kanban y sincronizar tus tareas en tiempo real.
        </p>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.featuresList}>
          <div className={styles.featureItem}>
            <Zap size={16} color="var(--accent-yellow)" />
            <span>Sincronización en tiempo real con Supabase</span>
          </div>
          <div className={styles.featureItem}>
            <Columns size={16} color="var(--blue-primary)" />
            <span>5 Columnas de flujo ágil de trabajo</span>
          </div>
          <div className={styles.featureItem}>
            <ShieldCheck size={16} color="var(--purple-secondary)" />
            <span>Acceso seguro protegido con GitHub OAuth</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.githubButton}
          onClick={handleSignIn}
          disabled={loading}
          id="hero-github-login-btn"
          data-testid="hero-github-login-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          <span>{loading ? 'Conectando con GitHub...' : 'Continuar con GitHub'}</span>
        </button>

        <p className={styles.footerText}>
          Autenticación segura proporcionada por Supabase Auth & GitHub OAuth
        </p>
      </div>
    </div>
  );
}
