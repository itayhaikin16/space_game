import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'leaderboard.json');

function readScores() {
  try {
    if (!fs.existsSync(FILE_PATH)) return [];
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeScores(scores: any[]) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(scores, null, 2));
}

export async function GET() {
  const scores = readScores();
  return NextResponse.json(scores);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { score, username } = body;
  
  const scores = readScores();
  scores.push({ score, username, date: new Date().toLocaleDateString() });
  
  // Sort by score descending and take top 10
  const topScores = scores.sort((a: any, b: any) => b.score - a.score).slice(0, 10);
  
  writeScores(topScores);
  return NextResponse.json(topScores);
}
