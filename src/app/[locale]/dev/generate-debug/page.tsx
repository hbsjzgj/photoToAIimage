'use client';
import { useState } from 'react';

interface FalDebugState {
  keyPresent: boolean;
  keyPrefix: string;
  initialized: boolean;
  uploadStart: boolean;
  uploadSuccess: boolean;
  uploadUrl: string | null;
  modelInvoked: boolean;
  modelId: string;
  requestPayload: Record<string, unknown> | null;
  rawResponse: unknown;
  errorMessage: string | null;
  errorStack: string | null;
  errorJson: string | null;
}

interface GeminiDebugState {
  keyPresent: boolean;
  modelId: string;
  requestStarted: boolean;
  responseReceived: boolean;
  imageReturned: boolean;
  errorMessage: string | null;
  errorJson: string | null;
}

interface DebugResult {
  ok: boolean;
  provider: string | null;
  durationMs?: number;
  fallbackUsed?: boolean;
  imageBase64Length: number;
  storageProvider: string | null;
  watermarkStatus: string;
  storageStatus: string;
  imageUrl: string | null;
  falDebug?: FalDebugState | null;
  geminiDebug?: GeminiDebugState | null;
  logs: string[];
  error: string | null;
}

export default function GenerateDebugPage() {
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState('');
  const [style, setStyle] = useState('anime_basic');
  const [fileInfo, setFileInfo] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress like the main form does
    const objectUrl = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.onload = () => {
      const MAX = 768;
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const b64 = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      setImageBase64(b64);
      setFileInfo(`${file.name} → ${w}×${h} → ${b64.length} chars (${(b64.length / 1024).toFixed(0)} KB)`);
    };
    img.src = objectUrl;
  }

  async function runTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/dev/generate-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || undefined,
          style,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        provider: null,
        imageBase64Length: 0,
        storageProvider: null,
        watermarkStatus: 'unknown',
        storageStatus: 'unknown',
        imageUrl: null,
        logs: [],
        error: String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  const s: React.CSSProperties = {
    fontFamily: 'monospace',
    background: '#0F1115',
    minHeight: '100vh',
    color: '#F5F7FA',
    padding: '24px',
  };

  return (
    <div style={s}>
      <h1 style={{ fontSize: '18px', marginBottom: '4px', color: '#C8A96B' }}>Generate Debug</h1>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
        Tests the full pipeline: upload → provider → watermark → storage → result
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
        <div>
          <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>
            Upload image (optional — omit to use demo-1.jpg)
          </label>
          <input type="file" accept="image/*" onChange={handleFile}
            style={{ fontSize: '13px', color: '#ccc' }} />
          {fileInfo && (
            <p style={{ fontSize: '11px', color: '#6b9', marginTop: '4px' }}>{fileInfo}</p>
          )}
        </div>

        <div>
          <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            style={{ background: '#1a1d23', color: '#ccc', border: '1px solid #333', borderRadius: '6px', padding: '6px 10px', fontSize: '13px' }}>
            <option value="anime_basic">anime_basic (free)</option>
            <option value="soft_cartoon">soft_cartoon (free)</option>
            <option value="cute_pet">cute_pet (free)</option>
            <option value="simple_icon">simple_icon (free)</option>
          </select>
        </div>

        <button onClick={runTest} disabled={loading}
          style={{ padding: '10px 24px', background: loading ? '#555' : '#C8A96B', color: '#000', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px', width: 'fit-content' }}>
          {loading ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ marginTop: '32px' }}>
          {/* Status bar */}
          <div style={{ padding: '10px 16px', borderRadius: '8px', marginBottom: '20px', background: result.ok ? '#1a3a2a' : '#3a1a1a', border: `1px solid ${result.ok ? '#2a5' : '#a25'}` }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: result.ok ? '#4c4' : '#c44' }}>
              {result.ok ? '✓ SUCCESS' : '✗ FAILED'}
            </span>
            {result.provider && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>provider: {result.provider}</span>}
            {result.durationMs != null && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>duration: {(result.durationMs / 1000).toFixed(1)}s</span>}
            {result.fallbackUsed && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#c84' }}>fallback used</span>}
            {result.storageProvider && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#888' }}>storage: {result.storageProvider}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: result.imageUrl ? '1fr 1fr' : '1fr', gap: '24px' }}>
            {/* Image */}
            {result.imageUrl && (
              <div>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Result Image</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.imageUrl}
                  alt="Generated result"
                  style={{ maxWidth: '100%', borderRadius: '12px', display: 'block', border: '1px solid #333' }}
                />
                <p style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
                  {result.imageUrl.startsWith('data:') ? 'inline data URL' : result.imageUrl}
                </p>
              </div>
            )}

            {/* JSON */}
            <div>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Debug Response</p>
              <pre style={{ background: '#141720', padding: '14px', borderRadius: '8px', fontSize: '11px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '500px', border: '1px solid #222', color: '#ccc' }}>
                {JSON.stringify({ ...result, imageUrl: result.imageUrl?.startsWith('data:') ? 'data:image/png;base64,...(truncated)' : result.imageUrl }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Gemini Debug */}
          {result.geminiDebug && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>GeminiImageProvider Diagnostics</p>
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '14px', border: '1px solid #222', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {([
                  ['keyPresent', result.geminiDebug.keyPresent ? 'yes' : 'NO ← check GEMINI_API_KEY'],
                  ['modelId', result.geminiDebug.modelId],
                  ['requestStarted', result.geminiDebug.requestStarted ? 'yes' : 'no'],
                  ['responseReceived', result.geminiDebug.responseReceived ? 'yes' : 'no'],
                  ['imageReturned', result.geminiDebug.imageReturned ? 'yes' : 'NO ← no image in response'],
                  ['errorMessage', result.geminiDebug.errorMessage ?? '(none)'],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ fontSize: '11px', lineHeight: '1.8' }}>
                    <span style={{ color: '#666' }}>{k}: </span>
                    <span style={{ color: v.startsWith('NO') ? '#f87' : v === 'yes' ? '#6b9' : v === '(none)' ? '#555' : '#ccc' }}>{v}</span>
                  </div>
                ))}
              </div>
              {result.geminiDebug.errorJson && (
                <pre style={{ marginTop: '8px', background: '#1a0a0a', padding: '10px', borderRadius: '6px', fontSize: '10px', overflow: 'auto', maxHeight: '300px', border: '1px solid #a33', color: '#f87', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  error: {result.geminiDebug.errorJson}
                </pre>
              )}
            </div>
          )}

          {/* Fal Debug */}
          {result.falDebug && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>FalProvider Diagnostics</p>
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '14px', border: '1px solid #222', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {([
                  ['keyPresent', result.falDebug.keyPresent ? 'yes' : 'NO ← check Vercel env'],
                  ['keyPrefix', result.falDebug.keyPrefix],
                  ['initialized', result.falDebug.initialized ? 'yes' : 'no'],
                  ['uploadStart', result.falDebug.uploadStart ? 'yes' : 'no'],
                  ['uploadSuccess', result.falDebug.uploadSuccess ? 'yes' : 'NO ← upload failed'],
                  ['uploadUrl', result.falDebug.uploadUrl ?? '(none)'],
                  ['modelInvoked', result.falDebug.modelInvoked ? 'yes' : 'no'],
                  ['modelId', result.falDebug.modelId],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ fontSize: '11px', lineHeight: '1.8' }}>
                    <span style={{ color: '#666' }}>{k}: </span>
                    <span style={{ color: v.startsWith('NO') ? '#f87' : v === 'yes' ? '#6b9' : '#ccc' }}>{v}</span>
                  </div>
                ))}
              </div>
              {result.falDebug.requestPayload && (
                <pre style={{ marginTop: '8px', background: '#141720', padding: '10px', borderRadius: '6px', fontSize: '10px', overflow: 'auto', maxHeight: '200px', border: '1px solid #222', color: '#8af', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  payload: {JSON.stringify(result.falDebug.requestPayload, null, 2)}
                </pre>
              )}
              {result.falDebug.errorJson && (
                <pre style={{ marginTop: '8px', background: '#1a0a0a', padding: '10px', borderRadius: '6px', fontSize: '10px', overflow: 'auto', maxHeight: '300px', border: '1px solid #a33', color: '#f87', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  error: {result.falDebug.errorJson}
                </pre>
              )}
            </div>
          )}

          {/* Logs */}
          {result.logs?.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Step-by-step Logs</p>
              <div style={{ background: '#0a0c10', borderRadius: '8px', padding: '12px', border: '1px solid #222', maxHeight: '300px', overflow: 'auto' }}>
                {result.logs.map((line, i) => (
                  <div key={i} style={{ fontSize: '11px', color: line.includes('FAIL') || line.includes('ERROR') ? '#f87' : line.includes('OK') || line.includes('success') ? '#6b9' : '#aaa', lineHeight: '1.6' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {result.error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#2a1010', borderRadius: '8px', border: '1px solid #a33' }}>
              <p style={{ fontSize: '12px', color: '#f66' }}>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
