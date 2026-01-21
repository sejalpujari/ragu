// app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [chunkSize, setChunkSize] = useState(120);
  const [chunkOverlap, setChunkOverlap] = useState(30);
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rag/debug', {  // ← calls FastAPI via rewrite
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          top_k: topK,
          generate: false,  // first get debug data
        }),
      });
      const data = await res.json();
      setResult(data);

      // Then generate answer if wanted
      const ansRes = await fetch('/api/rag/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,  // reuse params
          generate: true,
        }),
      });
      const ansData = await ansRes.json();
      setAnswer(ansData.answer || '');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <main className="p-8">
      <h1 className="text-3xl mb-6">Explainable RAG (Next.js + FastAPI)</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question..."
        className="border p-2 w-full mb-4"
      />

      {/* Sliders for parameters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label>Chunk Size: {chunkSize}</label>
          <input type="range" min="50" max="800" value={chunkSize} onChange={e => setChunkSize(+e.target.value)} />
        </div>
        {/* similar for overlap & topK */}
      </div>

      <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-6 py-3">
        {loading ? 'Processing...' : 'Run RAG'}
      </button>

      {result && (
        <div className="mt-8 space-y-8">
          <section>
            <h2>Top-K Chunks</h2>
            {result.top_k_chunks?.map((c: any, i: number) => (
              <div key={i} className="border p-4 mt-2">
                <p className="font-bold">Score: {c.score}</p>
                <pre className="whitespace-pre-wrap">{c.text}</pre>
              </div>
            ))}
          </section>

          <section>
            <h2>Final Answer</h2>
            <div className="border p-4 bg-gray-50">{answer || 'No answer yet'}</div>
          </section>

          {/* Add more sections: documents, chunks, embeddings preview, etc. */}
        </div>
      )}
    </main>
  );
}