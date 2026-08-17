#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rchvwzvrnnulmfzwmozc.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaHZ3enZybm51bG1mendtb3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MzIzMTUsImV4cCI6MjEwMjUwODMxNX0.NUce9JRTsM_uj_FjRDIHSrPlIeWNbP-jxwAhu_U85lQ';

function getFilePath() {
  const rootPath = path.resolve(__dirname, '../kanban.json');
  const localPath = path.resolve(process.cwd(), 'kanban.json');
  if (fs.existsSync(rootPath)) return rootPath;
  if (fs.existsSync(localPath)) return localPath;
  return rootPath;
}

async function fetchFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kanban_board?id=eq.default&select=data`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0 && rows[0].data?.columns) {
        return rows[0].data;
      }
    }
  } catch (e) {}
  return null;
}

async function syncToSupabase(board) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/kanban_board`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: 'default',
        data: board,
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {}
}

async function loadBoard() {
  const cloudBoard = await fetchFromSupabase();
  if (cloudBoard) {
    saveLocalBoard(cloudBoard);
    return cloudBoard;
  }
  const filePath = getFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data && Array.isArray(data.columns)) return data;
    } catch (e) {
      console.error('Error parsing kanban.json:', e.message);
    }
  }
  return { columns: [] };
}

function saveLocalBoard(board) {
  const filePath = getFilePath();
  fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf-8');
}

async function saveBoard(board) {
  saveLocalBoard(board);
  await syncToSupabase(board);
}

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    } else {
      positional.push(arg);
    }
  }
  return { command: positional[0] || 'list', flags, positional: positional.slice(1) };
}

function findColumn(board, query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();
  return (
    board.columns.find((c) => c.id.toLowerCase() === q) ||
    board.columns.find((c) => c.title.toLowerCase() === q) ||
    board.columns.find((c) => c.title.toLowerCase().includes(q))
  );
}

function findCard(board, cardId) {
  for (const col of board.columns) {
    const card = col.cards.find((c) => c.id === cardId);
    if (card) return { card, column: col };
  }
  return null;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const board = await loadBoard();

  switch (command) {
    case 'list': {
      console.log('=== KANBAN BOARD STATUS ===\n');
      board.columns.forEach((col) => {
        console.log(`[${col.id}] ${col.title.toUpperCase()} (${col.cards.length} cards)`);
        if (col.cards.length === 0) {
          console.log('  (empty)');
        } else {
          col.cards.forEach((card) => {
            console.log(`  - [${card.id}] ${card.title}`);
            if (card.details) {
              console.log(`    Details: ${card.details}`);
            }
          });
        }
        console.log('');
      });
      break;
    }

    case 'status': {
      console.log('=== KANBAN SUMMARY ===');
      board.columns.forEach((col) => {
        console.log(`${col.title} [${col.id}]: ${col.cards.length} cards`);
      });
      break;
    }

    case 'json': {
      console.log(JSON.stringify(board, null, 2));
      break;
    }

    case 'add': {
      const colQuery = flags.column || flags.col || 'Backlog';
      const col = findColumn(board, colQuery);
      if (!col) {
        console.error(`Column "${colQuery}" not found.`);
        process.exit(1);
      }
      const title = flags.title || flags.t;
      const details = flags.details || flags.d || '';
      if (!title) {
        console.error('Missing required --title argument.');
        process.exit(1);
      }

      const newCard = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: String(title).trim(),
        details: String(details).trim(),
      };

      col.cards.push(newCard);
      await saveBoard(board);
      console.log(`Card created successfully: [${newCard.id}] "${newCard.title}" in column "${col.title}".`);
      break;
    }

    case 'move': {
      const cardId = flags.id || flags.card;
      const toQuery = flags.to || flags.column || flags.col;
      if (!cardId || !toQuery) {
        console.error('Usage: kanban move --id <card_id> --to <dest_column_name_or_id>');
        process.exit(1);
      }

      const destCol = findColumn(board, toQuery);
      if (!destCol) {
        console.error(`Target column "${toQuery}" not found.`);
        process.exit(1);
      }

      const match = findCard(board, cardId);
      if (!match) {
        console.error(`Card with ID "${cardId}" not found.`);
        process.exit(1);
      }

      // Remove from source column
      match.column.cards = match.column.cards.filter((c) => c.id !== cardId);

      // Add to destination column
      const destIndex = flags.index !== undefined ? parseInt(flags.index, 10) : destCol.cards.length;
      destCol.cards.splice(destIndex, 0, match.card);

      await saveBoard(board);
      console.log(`Moved card [${cardId}] "${match.card.title}" from "${match.column.title}" to "${destCol.title}".`);
      break;
    }

    case 'edit': {
      const cardId = flags.id || flags.card;
      const title = flags.title || flags.t;
      const details = flags.details || flags.d;
      if (!cardId || (!title && details === undefined)) {
        console.error('Usage: kanban edit --id <card_id> [--title <new_title>] [--details <new_details>]');
        process.exit(1);
      }

      const match = findCard(board, cardId);
      if (!match) {
        console.error(`Card with ID "${cardId}" not found.`);
        process.exit(1);
      }

      if (title !== undefined) {
        match.card.title = String(title).trim();
      }
      if (details !== undefined) {
        match.card.details = String(details).trim();
      }

      await saveBoard(board);
      console.log(`Updated card [${cardId}] "${match.card.title}".`);
      break;
    }

    case 'delete': {
      const cardId = flags.id || flags.card;
      if (!cardId) {
        console.error('Usage: kanban delete --id <card_id>');
        process.exit(1);
      }

      const match = findCard(board, cardId);
      if (!match) {
        console.error(`Card with ID "${cardId}" not found.`);
        process.exit(1);
      }

      match.column.cards = match.column.cards.filter((c) => c.id !== cardId);
      await saveBoard(board);
      console.log(`Deleted card [${cardId}] "${match.card.title}" from column "${match.column.title}".`);
      break;
    }

    case 'rename': {
      const colQuery = flags.column || flags.col;
      const newTitle = flags.title || flags.name;
      if (!colQuery || !newTitle) {
        console.error('Usage: kanban rename --column <column_id_or_name> --title <new_name>');
        process.exit(1);
      }

      const col = findColumn(board, colQuery);
      if (!col) {
        console.error(`Column "${colQuery}" not found.`);
        process.exit(1);
      }

      const oldTitle = col.title;
      col.title = String(newTitle).trim();
      await saveBoard(board);
      console.log(`Renamed column [${col.id}] from "${oldTitle}" to "${col.title}".`);
      break;
    }

    default:
      console.log(`
Kanban CLI for AI Agents & Developers

Commands:
  node scripts/kanban.js list
  node scripts/kanban.js status
  node scripts/kanban.js json
  node scripts/kanban.js add --column "<column_name_or_id>" --title "<title>" [--details "<details>"]
  node scripts/kanban.js move --id "<card_id>" --to "<dest_column_name_or_id>" [--index <num>]
  node scripts/kanban.js delete --id "<card_id>"
  node scripts/kanban.js rename --column "<col_id_or_name>" --title "<new_title>"
      `);
      break;
  }
}

main();
