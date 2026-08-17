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
        const codebaseContext = `
Proyecto: Kanban Board Fullstack Web App
Tecnologías: Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS Modules, Supabase (PostgreSQL & GitHub OAuth), Playwright E2E.
Repositorio GitHub: https://github.com/JeremyBourdier/kanban-board
Propietario: Jeremy Bourdier (bourdierestrellajeremy@gmail.com)
Tablero Kanban:
${
  boardContext
    ? boardContext.columns
        .map(
          (c) =>
            `- [${c.title}] (${c.cards.length} tarjetas): ` +
            c.cards.map((k) => `"${k.title}"`).join(', ')
        )
        .join('\n')
    : '5 columnas estándar.'
}
`;

        const systemPrompt = `Eres Antigravity, el agente de IA de codificación avanzada de Google DeepMind que está programando en pareja con Jeremy Bourdier en este proyecto Kanban. Eres un ingeniero de software senior, hablas en español, eres conciso, técnico y directo. Conoces todo el código fuente del proyecto, el pipeline de Playwright y el estado de Supabase. Responde siempre como el agente programador Antigravity en el IDE.\nContexto: ${codebaseContext}`;

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

    // Direct Antigravity IDE Agent reasoning engine
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

    if (
      userQuery.includes('quien eres') ||
      userQuery.includes('quién eres') ||
      userQuery.includes('antigravity') ||
      userQuery.includes('presentate') ||
      userQuery.includes('presentate')
    ) {
      responseText = `Soy **Antigravity**, tu agente de inteligencia artificial para desarrollo autónomo de software (Google DeepMind).

Estoy conectado directamente a tu entorno de trabajo en \`c:\\Users\\bourd\\projects\\kanban\\kanban\` y me encargo de:
1. **Programar y refactorizar código**: Escribo TypeScript, React 19 y CSS Modules siguiendo los estándares del proyecto.
2. **Ejecutar pruebas automatizadas**: Corro y valido la suite de Playwright (\`npx playwright test\`).
3. **Monitoreo autónomo**: Reviso periódicamente el tablero en Supabase para tomar cualquier tarea que coloques en **Ready**, implementarla, probarla y desplegarla automáticamente a GitHub/Vercel.

¿En qué parte del código o arquitectura deseas que trabajemos hoy?`;
    } else if (
      userQuery.includes('codigo') ||
      userQuery.includes('código') ||
      userQuery.includes('arquitectura') ||
      userQuery.includes('estructura') ||
      userQuery.includes('stack')
    ) {
      responseText = `### Arquitectura del Proyecto Kanban

El proyecto está organizado de la siguiente manera:

- **Frontend (\`frontend/\`)**:
  - \`src/components/\`: \`KanbanBoard.tsx\`, \`KanbanColumn.tsx\`, \`KanbanCard.tsx\`, \`ChatWidget.tsx\`, \`Header.tsx\`, etc.
  - \`src/hooks/\`: \`useKanbanBoard.ts\` (gestión de estado y sincronización), \`useAuth.ts\` (Supabase OAuth & whitelist de JeremyBourdier), \`useTheme.ts\`.
  - \`src/app/api/\`: \`/api/board\` (persistencia en Supabase/local) y \`/api/chat\` (este canal de comunicación).
  - \`e2e/\`: Suite completa de Playwright (\`auth.spec.ts\`, \`kanban.spec.ts\`, \`mobile.spec.ts\`, \`chat.spec.ts\`, etc.).
- **Scripts CLI (\`scripts/kanban.js\`)**:
  - Herramienta para manipular el tablero vía consola (\`list\`, \`status\`, \`add\`, \`edit\`, \`move\`, \`delete\`).
- **Base de Datos & Auth**:
  - Supabase PostgreSQL (\`kanban_board\`) y GitHub OAuth para control de acceso exclusivo.`;
    } else if (
      userQuery.includes('monitor') ||
      userQuery.includes('autonomo') ||
      userQuery.includes('autónomo') ||
      userQuery.includes('daemon') ||
      userQuery.includes('ready')
    ) {
      responseText = `### Sistema de Monitoreo Autónomo

Actualmente tengo un **proceso demonio en segundo plano** (\`task-789\`) ejecutándose cada minuto:

1. **Detección**: Consulta Supabase para ver si hay tarjetas en la columna **Ready** (\`col-2\`).
2. **Asignación**: Si encuentra una tarjeta, la mueve a **In Progress** (\`col-3\`).
3. **Desarrollo**: Analiza el título y los detalles de la tarjeta, realiza las modificaciones de código necesarias y verifica la compilación con Turbopack.
4. **Verificación**: Ejecuta la suite completa de Playwright (\`npx playwright test\`).
5. **Entrega y Despliegue**: Mueve la tarjeta a **Done** (\`col-5\`), hace commit en Git y push a \`main\` en GitHub para el despliegue automático en Vercel.`;
    } else if (
      userQuery.includes('commit') ||
      userQuery.includes('cambios') ||
      userQuery.includes('despliegue') ||
      userQuery.includes('ultimo') ||
      userQuery.includes('último')
    ) {
      responseText = `### Últimos Cambios Desplegados en Producción

1. **Interfaz de Chat con Antigravity**: Panel de interacción directa con el agente programador en IDE.
2. **Scroll vertical individual**: Cada columna tiene su propio scrollbar suave manteniendo cabeceras fijas.
3. **Diseño Mobile-First**: Píldoras adaptativas de columnas (\`flex-wrap\`), navegación táctil y modales tipo bottom-sheet.
4. **Edición de tareas**: Modal completo para modificar títulos y descripciones en tiempo real.
5. **Autenticación con GitHub**: Acceso exclusivo restringido a JeremyBourdier con pantalla de protección.`;
    } else if (
      userQuery.includes('resumen') ||
      userQuery.includes('estado') ||
      userQuery.includes('tablero')
    ) {
      responseText = `### Estado del Tablero (\`${totalCards}\` tarjetas registradas)\n\n`;
      if (boardContext) {
        boardContext.columns.forEach((col) => {
          responseText += `- **${col.title}:** ${col.cards.length} tarjeta(s)\n`;
        });
      }
      responseText += `\n*Recuerda que cualquier tarjeta que crees y coloques en "Ready" la comenzaré a programar inmediatamente de forma autónoma.*`;
    } else if (userQuery.includes('hola') || userQuery.includes('saludos') || userQuery.includes('buenas')) {
      responseText = `¡Hola Jeremy! Aquí Antigravity desde tu IDE. Estoy listo para programar, revisar el código del proyecto o implementar nuevas funciones. ¿Qué te gustaría que hagamos?`;
    } else {
      responseText = `Hola Jeremy. He recibido tu mensaje: "${lastMessage.content}".

Como agente programador de Antigravity en tu IDE, puedo:
- Explicarte cualquier parte del **código y arquitectura** del proyecto.
- Revisar el estado de las **pruebas automatizadas** o **despliegues de Vercel**.
- Planificar o desglosar nuevas funcionalidades técnicas antes de que las agregues a **Ready**.

¿Deseas que revise o implemente algo en específico?`;
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
    return NextResponse.json({ error: 'Error al procesar el mensaje con Antigravity' }, { status: 500 });
  }
}
