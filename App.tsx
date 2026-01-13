import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
      <div className="max-w-2xl p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h1 className="text-3xl font-bold mb-4 text-amber-500">Empire of the Two Rivers</h1>
        <div className="p-4 bg-slate-900 rounded border border-slate-700 font-mono text-sm text-green-400">
          <p>Project initialized with Enhanced Architecture v3.</p>
          <p>Ready for module generation.</p>
        </div>
        <div className="mt-6 space-y-2 text-slate-400 text-sm">
          <p>Architecture Layers Loaded:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><span className="text-amber-400">types</span>: Single Source of Truth</li>
            <li><span className="text-blue-400">core</span>: Pure ECS Logic & Simulation</li>
            <li><span className="text-purple-400">view</span>: R3F Rendering Layer</li>
            <li><span className="text-pink-400">ui</span>: React DOM Interface</li>
            <li><span className="text-gray-400">infrastructure</span>: Input, Audio, Persistence</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;