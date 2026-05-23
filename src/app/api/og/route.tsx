import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const score = searchParams.get('score') || '0';
    const total = searchParams.get('total') || '0';
    const game = searchParams.get('game') || 'Quiz';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8faf9',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #00a8b510 2%, transparent 0%), radial-gradient(circle at 75px 75px, #00a8b510 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            fontFamily: 'sans-serif',
            padding: '40px',
            border: '20px solid #00a8b5',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '60px',
              borderRadius: '40px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              border: '2px dashed #cbd5e1',
            }}
          >
            <h1
              style={{
                fontSize: 80,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: '#00a8b5',
                margin: 0,
                letterSpacing: '0.1em',
              }}
            >
              GeoGeek
            </h1>
            <div
              style={{
                fontSize: 32,
                color: '#64748b',
                marginTop: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
              }}
            >
              Mastery Achieved
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '40px',
              }}
            >
              <span style={{ fontSize: 120, fontWeight: 'black', color: '#1e293b' }}>{score}</span>
              <span style={{ fontSize: 60, color: '#94a3b8', margin: '0 20px', marginTop: '20px' }}>/</span>
              <span style={{ fontSize: 80, color: '#64748b', marginTop: '10px' }}>{total}</span>
            </div>
            <p
              style={{
                fontSize: 36,
                color: '#334155',
                marginTop: '20px',
                textAlign: 'center',
                fontWeight: '500',
              }}
            >
              on the {game} challenge!
            </p>
            <div
              style={{
                display: 'flex',
                marginTop: '40px',
                padding: '10px 30px',
                backgroundColor: '#00a8b5',
                borderRadius: '20px',
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              geogeek.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
