import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  // Placeholder live route. Replace with real OpenAI Vision logic when ready.
  if (!body?.image) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 });
  }

  return NextResponse.json({
    summary: 'Live endpoint placeholder: add OpenAI Vision here to replace demo behavior.',
    detections: [
      {
        title: 'No Hard Hat',
        code: 'OSHA 1926.100',
        severity: 'High',
        detail: 'Sample response from the API route. Replace this with real AI analysis.',
        confidence: 0.84,
        bbox: { x: 40, y: 12, w: 18, h: 20 },
      },
    ],
  });
}
