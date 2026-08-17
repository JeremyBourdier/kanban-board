import { NextResponse } from 'next/server';
import { KanbanBoardState } from '@/types/kanban';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export async function POST(request: Request) {
  try {
    const { messages, boardContext }: { messages: ChatMessage[]; boardContext?: KanbanBoardState } =
      await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes requeridos' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = (lastMessage?.content || '').toLowerCase().trim();

    // Check if an external Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const promptContext = boardContext
          ? `Contexto actual del tablero Kanban:\n${boardContext.columns
              .map(
                (c) =>
                  `Columna "${c.title}" (${c.cards.length} tarjetas):\n` +
                  c.cards.map((k) => `  - [${k.title}]: ${k.details}`).join('\n')
              )
              .join('\n\n')}`
          : 'Tablero Kanban activo.';

        const systemPrompt = `Eres el asistente de IA integrado de este tablero Kanban. Eres conciso, profesional y hablas en español. Ayudas al usuario a organizar tareas, resumir el estado del proyecto y planificar mejoras. Contexto del proyecto: ${promptContext}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                ...messages.map((m) => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }],
                })),
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'No pude generar una respuesta con el modelo.';
          return NextResponse.json({
            message: {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: replyText,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (geminiErr) {
        console.error('Error llamando a Gemini API:', geminiErr);
      }
    }

    // Built-in intelligent assistant reasoning engine
    let responseText = '';

    const totalCards = boardContext
      ? boardContext.columns.reduce((sum, col) => sum + col.cards.length, 0)
      : 0;

    const doneCol = boardContext?.columns.find((c) => c.id === 'col-5' || c.title.toLowerCase().includes('done'));
    const inProgCol = boardContext?.columns.find(
      (c) => c.id === 'col-3' || c.title.toLowerCase().includes('progress')
    );
    const readyCol = boardContext?.columns.find(
      (c) => c.id === 'col-2' || c.title.toLowerCase().includes('ready')
    );
    const backlogCol = boardContext?.columns.find(
      (c) => c.id === 'col-1' || c.title.toLowerCase().includes('backlog')
    );

    if (
      userQuery.includes('resumen') ||
      userQuery.includes('estado') ||
      userQuery.includes('tablero') ||
      userQuery.includes('status')
    ) {
      responseText = `### Resumen Actual del Tablero Kanban\n\n- **Total de tareas registradas:** ${totalCards}\n`;
      if (boardContext) {
        boardContext.columns.forEach((col) => {
          responseText += `- **${col.title}:** ${col.cards.length} tarjeta(s)\n`;
        });
      }
      responseText += `\n*El sistema de monitoreo en segundo plano sigue activo y detectará cualquier tarjeta que pases a "Ready".*`;
    } else if (
      userQuery.includes('completad') ||
      userQuery.includes('terminad') ||
      userQuery.includes('done')
    ) {
      if (doneCol && doneCol.cards.length > 0) {
        responseText = `### Tareas Completadas (${doneCol.cards.length})\n\n`;
        doneCol.cards.forEach((card, idx) => {
          responseText += `${idx + 1}. **${card.title}**\n   ${card.details}\n\n`;
        });
      } else {
        responseText = `Actualmente no hay tareas en la columna Done.`;
      }
    } else if (
      userQuery.includes('progreso') ||
      userQuery.includes('in progress') ||
      userQuery.includes('haciendo')
    ) {
      if (inProgCol && inProgCol.cards.length > 0) {
        responseText = `### Tareas en Progreso (${inProgCol.cards.length})\n\n`;
        inProgCol.cards.forEach((card, idx) => {
          responseText += `${idx + 1}. **${card.title}**\n   ${card.details}\n\n`;
        });
      } else {
        responseText = `No hay tareas en progreso en este momento. Si colocas una tarea en **Ready**, la tomaré de inmediato de forma autónoma.`;
      }
    } else if (
      userQuery.includes('ready') ||
      userQuery.includes('pendiente') ||
      userQuery.includes('siguiente')
    ) {
      if (readyCol && readyCol.cards.length > 0) {
        responseText = `### Tareas Listas en Ready (${readyCol.cards.length})\n\n`;
        readyCol.cards.forEach((card, idx) => {
          responseText += `${idx + 1}. **${card.title}**\n   ${card.details}\n\n`;
        });
      } else {
        responseText = `No hay tareas pendientes en **Ready**. Puedes crear una nueva tarea o mover una existente a Ready para que empiece a trabajar en ella.`;
      }
    } else if (
      userQuery.includes('crear') ||
      userQuery.includes('sugerir') ||
      userQuery.includes('nueva tarea') ||
      userQuery.includes('idea')
    ) {
      responseText = `Aquí tienes algunas sugerencias de funcionalidades útiles que podemos desarrollar:\n\n1. **Filtros por etiquetas de color:** Añadir etiquetas (Bug, Feature, Urgente) para clasificar tarjetas visualmente.\n2. **Historial de auditoría:** Registro de cambios recientes mostrando quién movió o editó cada tarjeta.\n3. **Exportar a CSV/JSON:** Opción para descargar una copia de seguridad local del tablero con un clic.\n4. **Animaciones de confetti al completar:** Efecto visual de celebración cuando una tarjeta se mueve a Done.\n\n*Si deseas alguna de estas o una idea propia, puedes crear la tarjeta en Backlog o Ready.*`;
    } else if (userQuery.includes('hola') || userQuery.includes('saludos') || userQuery.includes('buenos')) {
      responseText = `¡Hola! Soy tu asistente de Kanban. Estoy aquí para conversar, responder dudas sobre la aplicación, ayudarte a redactar requerimientos o informarte sobre el estado de tus tarjetas en tiempo real. ¿En qué te puedo colaborar hoy?`;
    } else {
      responseText = `Entendido. He procesado tu consulta: "${lastMessage.content}".\n\nPuedo ayudarte con:\n- Consultar el **resumen o estado** del tablero.\n- Ver las tareas en **progreso o completadas**.\n- Sugerir o redactar **nuevas características** para tus tarjetas.\n\n¿Deseas que revise algún apartado específico del tablero?`;
    }

    return NextResponse.json({
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ error: 'Error al procesar el mensaje' }, { status: 500 });
  }
}
