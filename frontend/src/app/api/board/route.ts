import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { KanbanBoardState } from '@/types/kanban';
import { initialBoardData } from '@/data/initialData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

function readLocalBoardData(): KanbanBoardState {
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
    console.error('Error reading local kanban.json:', error);
  }
  return initialBoardData;
}

function writeLocalBoardData(data: KanbanBoardState): boolean {
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
      console.error('Error writing local kanban.json:', e);
      return false;
    }
  }
}

export async function GET() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('kanban_board')
        .select('data')
        .eq('id', 'default')
        .single();

      if (!error && data?.data?.columns?.length) {
        return NextResponse.json(data.data, {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
      }

      // If record does not exist yet, seed it with local data
      const defaultState = readLocalBoardData();
      await supabase
        .from('kanban_board')
        .upsert({ id: 'default', data: defaultState, updated_at: new Date().toISOString() });

      return NextResponse.json(defaultState, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    } catch (err) {
      console.error('Supabase query failed, falling back to local storage:', err);
    }
  }

  const board = readLocalBoardData();
  return NextResponse.json(board, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.columns)) {
      return NextResponse.json({ error: 'Invalid board structure' }, { status: 400 });
    }

    // Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('kanban_board')
          .upsert({ id: 'default', data: body, updated_at: new Date().toISOString() });
      } catch (err) {
        console.error('Supabase update failed:', err);
      }
    }

    // Save to local file backup
    writeLocalBoardData(body);

    return NextResponse.json({ success: true, board: body });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
