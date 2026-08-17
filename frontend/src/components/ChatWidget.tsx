'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Trash2, Bot, Sparkles, ChevronDown } from 'lucide-react';
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
      '¡Hola! Soy tu asistente de Kanban. Puedes hacerme preguntas sobre el tablero, pedirme resúmenes de tareas o solicitar sugerencias para tu proyecto sin necesidad de modificar el código.',
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTIONS = [
  '¿Cuál es el resumen del tablero?',
  '¿Qué tareas se han completado?',
  '¿Hay tareas en progreso o ready?',
  'Sugiéreme nuevas ideas de tareas',
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
      const saved = localStorage.getItem('kanban_chat_history');
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
      localStorage.setItem('kanban_chat_history', JSON.stringify(newMessages));
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
          content: 'Disculpa, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
          timestamp: new Date().toISOString(),
        };
        persistMessages([...updated, errorMsg]);
      }
    } catch (err) {
      const networkErrorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'No se pudo conectar con el servidor de chat. Verifica tu conexión.',
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
        aria-label="Abrir chat de asistencia"
        data-testid="chat-floating-button"
        title="Abrir Chat con el Asistente"
      >
        {isOpen ? <ChevronDown size={24} /> : <MessageSquare size={24} />}
        <span className={styles.chatBadge} />
      </button>

      {isOpen && (
        <aside
          className={styles.chatDrawer}
          data-testid="chat-drawer"
          aria-label="Panel de chat con el asistente"
        >
          <header className={styles.header}>
            <div className={styles.headerTitleArea}>
              <div className={styles.botAvatar}>
                <Bot size={18} />
              </div>
              <div className={styles.headerTexts}>
                <span className={styles.headerTitle}>Asistente Kanban</span>
                <span className={styles.headerStatus}>
                  <span className={styles.onlineDot} /> En línea
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
              placeholder="Escribe un mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Mensaje para el asistente"
              data-testid="chat-input"
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Enviar mensaje"
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
