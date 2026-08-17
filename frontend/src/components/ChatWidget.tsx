'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Terminal, Sparkles, ChevronDown, Code2 } from 'lucide-react';
import { KanbanBoardState } from '../types/kanban';
import styles from './ChatWidget.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatWidgetProps {
  boardContext: KanbanBoardState;
  isOpen: boolean;
  onToggle: () => void;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content:
      '¡Hola Jeremy! Soy **Antigravity**, tu agente programador autónomo en el IDE (Google DeepMind). Puedes hablar directamente conmigo sobre el código, la arquitectura, el monitoreo autónomo o consultar el estado de tu proyecto sin necesidad de iterar sobre el código manualmente.',
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTIONS = [
  '¿Cómo está estructurado el código?',
  '¿Cómo funciona el monitor autónomo?',
  '¿Cuáles fueron los últimos cambios desplegados?',
  '¿Cuál es el estado del tablero?',
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({ boardContext, isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kanban_chat_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading chat history:', e);
    }
  }, []);

  // Save chat history to localStorage
  const persistMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    try {
      localStorage.setItem('kanban_chat_history_v2', JSON.stringify(newMessages));
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMessage];
    persistMessages(updated);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          boardContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.message) {
          persistMessages([...updated, data.message]);
        }
      } else {
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Ocurrió un error al procesar tu consulta con Antigravity. Por favor intenta nuevamente.',
          timestamp: new Date().toISOString(),
        };
        persistMessages([...updated, errorMsg]);
      }
    } catch (err) {
      const networkErrorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'No se pudo conectar con el agente Antigravity. Verifica tu conexión.',
        timestamp: new Date().toISOString(),
      };
      persistMessages([...updated, networkErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    persistMessages(INITIAL_MESSAGES);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.floatingTrigger}
        onClick={onToggle}
        aria-label="Abrir chat con Antigravity Agent"
        data-testid="chat-floating-button"
        title="Hablar con Antigravity (Agente Programador)"
      >
        {isOpen ? <ChevronDown size={24} /> : <Terminal size={24} />}
        <span className={styles.chatBadge} />
      </button>

      {isOpen && (
        <aside
          className={styles.chatDrawer}
          data-testid="chat-drawer"
          aria-label="Panel de chat con Antigravity Agent"
        >
          <header className={styles.header}>
            <div className={styles.headerTitleArea}>
              <div className={styles.botAvatar}>
                <Terminal size={17} />
              </div>
              <div className={styles.headerTexts}>
                <span className={styles.headerTitle}>Antigravity IDE Agent</span>
                <span className={styles.headerStatus}>
                  <span className={styles.onlineDot} /> IDE Conectado • Google DeepMind
                </span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleClearHistory}
                title="Limpiar conversación"
                aria-label="Limpiar conversación"
                data-testid="chat-clear-btn"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onToggle}
                title="Cerrar chat"
                aria-label="Cerrar chat"
                data-testid="chat-close-btn"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className={styles.messagesList} data-testid="chat-messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  msg.role === 'user' ? styles.userRow : styles.assistantRow
                }`}
                data-testid={`chat-message-${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles.agentTag}>
                    <Code2 size={12} />
                    <span>Antigravity IDE Agent</span>
                  </div>
                )}
                <div
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                  }`}
                >
                  {msg.content}
                </div>
                <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.messageRow} ${styles.assistantRow}`}>
                <div className={styles.agentTag}>
                  <Code2 size={12} />
                  <span>Antigravity pensando...</span>
                </div>
                <div className={styles.typingIndicator} data-testid="chat-typing-indicator">
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.chipsContainer}>
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.chip}
                onClick={() => handleSendMessage(suggestion)}
                data-testid={`chat-chip-${idx}`}
              >
                <Sparkles size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {suggestion}
              </button>
            ))}
          </div>

          <div className={styles.inputArea}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              rows={1}
              placeholder="Habla con Antigravity en el IDE..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Mensaje para Antigravity"
              data-testid="chat-input"
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Enviar mensaje a Antigravity"
              data-testid="chat-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
