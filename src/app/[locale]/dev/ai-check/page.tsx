'use client';

import { useState } from 'react';

interface ConfigStatus {
  AI_PROVIDER: string;
  HUGGINGFACE_API_TOKEN: string;
  POLLINATIONS_ENABLED: string;
  NEXT_PUBLIC_DEMO_MODE: string;
}

interface TestResult {
  success: boolean;
  provider?: string;
  fallbackUsed?: boolean;
  isTextToImage?: boolean;
  imageUrl?: string;
  durationMs?: number;
  error?: string;
}

export default function AICheckPage() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadConfig() {
    const res = await fetch('/api/dev/ai-check');
    setConfig(await res.json());
  }

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/dev/ai-check', { method: 'POST' });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'monospace', padding: '0 16px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>AI Provider Check</h1>

      <button onClick={loadConfig} style={btnStyle}>
        Load Config
      </button>

      {config && (
        <pre style={preStyle}>{JSON.stringify(config, null, 2)}</pre>
      )}

      <br />

      <button onClick={runTest} disabled={loading} style={btnStyle}>
        {loading ? 'Running...' : 'Run AI Test'}
      </button>

      {result && (
        <>
          <pre style={{ ...preStyle, borderColor: result.success ? '#4ade80' : '#f87171' }}>
            {JSON.stringify(
              {
                success: result.success,
                provider: result.provider,
                fallbackUsed: result.fallbackUsed,
                isTextToImage: result.isTextToImage,
                durationMs: result.durationMs,
                error: result.error
              },
              null,
              2
            )}
          </pre>

          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt="AI generated"
              style={{ width: '100%', maxWidth: 512, marginTop: 12, borderRadius: 8 }}
            />
          )}
        </>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '8px 20px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  marginRight: 8
};

const preStyle: React.CSSProperties = {
  background: '#1e1e1e',
  color: '#d4d4d4',
  padding: 16,
  borderRadius: 8,
  border: '1px solid #444',
  marginTop: 12,
  overflow: 'auto'
};
