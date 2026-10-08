'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="sr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#ffffff',
          color: '#18181b',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
          AutoTrampa se nije učitala
        </h1>
        <p style={{ fontSize: '14px', color: '#a3a3a3', margin: 0, maxWidth: '320px' }}>
          Došlo je do greške pri učitavanju aplikacije.
          {error.digest ? ` (#${error.digest})` : ''}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '8px',
            border: 0,
            borderRadius: '12px',
            background: '#FAEB00',
            color: '#18181b',
            fontWeight: 700,
            fontSize: '14px',
            padding: '12px 20px',
            cursor: 'pointer',
          }}
        >
          Pokušaj ponovo
        </button>
      </body>
    </html>
  );
}
