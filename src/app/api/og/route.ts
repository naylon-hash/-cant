import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '$CANT Open Graph Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cant = searchParams.get('cant') || "I can’t. We can’t. You can’t.";
  const can = searchParams.get('can') || 'CAN: Convert fear to fuel. press buy. $CANT.';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#d1fae5',
          padding: 48,
          fontFamily: 'ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        <div style={{ fontSize: 28, color: '#34d399', marginBottom: 24 }}>$CANT</div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 40, lineHeight: 1.3, color: '#e5e7eb' }}>{`$CANT> ${cant}`}</div>
        <div style={{ height: 20 }} />
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 34, lineHeight: 1.3 }}>{`$CANT_AI> ${can}`}</div>
      </div>
    ),
    { ...size }
  );
}
