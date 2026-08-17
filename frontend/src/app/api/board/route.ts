import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { KanbanBoardState } from '@/types/kanban';
import { initialBoardData } from '@/data/initialData';

export const dynamic = 'force-dynamic';

function getFilePath(): string {
  const rootPath = path.join(process.cwd(), '..', 'kanban.json');
  const localPath = path.join(process.cwd(), 'kanban.json');
  const tmpPath = path.join('/tmp', 'kanban.json');

  if (fs.existsSync(/* turbopackIgnore: true */ rootPath)) return rootPath;
  if (fs.existsSync(/* turbopackIgnore: true */ localPath)) return localPath;
  if (fs.existsSync(/* turbopackIgnore: true */ tmpPath)) return tmpPath;

  return process.env.VERCEL
    ? tmpPath
    : fs.existsSync(path.join(process.cwd(), 'src'))
    ? rootPath
    : localPath;
}

function readBoardData(): KanbanBoardState {
  try {
    const filePath = getFilePath();
    if (fs.existsSync(/* turbopackIgnore: true */ filePath)) {
      const content = fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.columns) && parsed.columns.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading kanban.json:', error);
  }
  return initialBoardData;
}

function writeBoardData(data: KanbanBoardState): boolean {
  try {
    const filePath = getFilePath();
    fs.writeFileSync(/* turbopackIgnore: true */ filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    try {
      const tmpPath = path.join('/tmp', 'kanban.json');
      fs.writeFileSync(/* turbopackIgnore: true */ tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('Error writing kanban.json:', e);
      return false;
    }
  }
}

export async function GET() {
  const board = readBoardData();
  return NextResponse.json(board, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.columns)) {
      return NextResponse.json({ error: 'Invalid board structure' }, { status: 400 });
    }

    const success = writeBoardData(body);
    if (!success) {
      return NextResponse.json({ error: 'Failed to write to kanban.json' }, { status: 500 });
    }

    return NextResponse.json({ success: true, board: body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
