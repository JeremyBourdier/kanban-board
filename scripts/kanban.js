#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getFilePath() {
  const rootPath = path.resolve(__dirname, '../kanban.json');
  const localPath = path.resolve(process.cwd(), 'kanban.json');
  if (fs.existsSync(rootPath)) return rootPath;
  if (fs.existsSync(localPath)) return localPath;
  return rootPath;
}

function loadBoard() {
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

function saveBoard(board) {
  const filePath = getFilePath();
  fs.writeFileSync(filePath, JSON.stringify(board, null, 2), 'utf-8');
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

function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const board = loadBoard();

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
      saveBoard(board);
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

      saveBoard(board);
      console.log(`Moved card [${cardId}] "${match.card.title}" from "${match.column.title}" to "${destCol.title}".`);
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
      saveBoard(board);
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
      saveBoard(board);
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
