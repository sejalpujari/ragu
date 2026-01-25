// src/app/page.tsx
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
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ragbackend-seven.vercel.app/';

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setAnswer('');

    try {
      const payload = {
        query,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        top_k: topK,           // frontend topK used for display limit
      };

      const res = await fetch(`${BACKEND_URL}/rag/debug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, generate: true }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText.slice(0, 200));
      }

      const data = await res.json();
      setResult(data);
      setAnswer(data.answer?.trim() || '(no answer returned)');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection error – is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100/50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Explainable RAG
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            See inside the full retrieval & generation pipeline • Next.js + FastAPI
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/70 overflow-hidden mb-12">
          <div className="p-6 sm:p-8">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[140px] text-gray-800 placeholder:text-gray-400 transition-all duration-200 shadow-sm"
              rows={4}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              {[
                { label: 'Chunk Size', value: chunkSize, set: setChunkSize, min: 50, max: 800, step: 10 },
                { label: 'Chunk Overlap', value: chunkOverlap, set: setChunkOverlap, min: 0, max: 300, step: 5 },
                { label: 'Display Top K', value: topK, set: setTopK, min: 1, max: 12, step: 1 },
              ].map(({ label, value, set, min, max, step }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !query.trim()}
              className={`
                mt-8 w-full py-4 px-8 rounded-xl font-semibold text-white text-lg
                transition-all duration-200 shadow-md
                ${loading || !query.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Run RAG Pipeline →'
              )}
            </button>

            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────── */}
        {/* RESULTS AREA */}
        {/* ──────────────────────────────────────────────── */}
        {result && (
          <div className="space-y-14">
            {/* 1. Raw Documents */}
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Raw Documents</h2>
              <div className="space-y-4">
                {Object.entries(result.documents || {}).map(([name, text]: [string, any]) => (
                  <details key={name} className="group border border-gray-200 rounded-lg">
                    <summary className="px-4 py-3 font-medium cursor-pointer list-none bg-blue-700">
                      {name}
                    </summary>
                    <div className="px-4 py-5 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 border-t">
                      {String(text)}
                    </div>
                  </details>
                ))}
                {!result.documents && <p className="text-gray-500 italic">No raw documents metadata available</p>}
              </div>
            </section>

            {/* 2. Top Retrieved Chunks */}
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                2. Top {topK} Retrieved Chunks
              </h2>
              <div className="space-y-6">
                {result.top_k_chunks?.map((chunk: any, i: number) => (
                  <div
                    key={i}
                    className="border-l-4 border-blue-500 bg-gray-50/60 rounded-xl p-5 transition-all hover:bg-gray-100/80"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-3 text-sm text-gray-600">
                      <span className="font-medium text-blue-700">
                        Score: {chunk.score?.toFixed(4) ?? '—'}
                      </span>
                      <span className="font-mono">
                        {chunk.file} • chunk {chunk.chunk_id}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                      {chunk.text}
                    </pre>
                  </div>
                )) || <p className="text-gray-500 italic">No chunks retrieved</p>}
              </div>
            </section>

            {/* 3. Final Context */}
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                3. Final Context Sent to LLM
              </h2>
              <pre className="bg-gray-50/80 p-5 rounded-xl text-sm text-gray-800 overflow-x-auto max-h-105 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200">
                {result.final_context || result.top_k_chunks?.map((c: any) => c.text).join('\n\n') || '(context not returned)'}
              </pre>
            </section>

            {/* 4. Generated Answer */}
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                4. Generated Answer
              </h2>
              {answer ? (
                <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
                  <div className="bg-gray-50/70 p-6 rounded-xl border border-gray-200 whitespace-pre-wrap">
                    {answer}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No answer was generated</p>
              )}
            </section>

            {/* 5. All Similarity Scores (collapsible) */}
            <section className="bg-white rounded-2xl shadow-xl border border-gray-200/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                5. Similarity Scores – All Chunks
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {result.similarity_data?.map((item: any, i: number) => (
                  <details key={i} className="group border-b border-gray-200 pb-3 last:border-0">
                    <summary className="flex justify-between items-center cursor-pointer list-none hover:bg-gray-50/50 py-1">
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${item.score > 0.4 ? 'text-green-700' : 'text-amber-700'}`}>
                          {item.score?.toFixed(4) ?? '—'}
                        </span>
                        <span className="text-sm text-gray-600 font-mono">
                          {item.file} • chunk {item.chunk_id}
                        </span>
                      </div>
                      <span className="text-gray-400 transition group-open:rotate-180">▼</span>
                    </summary>
                    <div className="mt-3 pl-8 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.text}
                    </div>
                  </details>
                )) || <p className="text-gray-500 italic">No similarity data available</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}