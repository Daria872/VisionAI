import React, { useEffect, useState } from 'react';
import { SelectedBenchmark } from '../types.js';

export default function BenchmarkSuite() {
  const [benchmarks, setBenchmarks] = useState<SelectedBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SelectedBenchmark | null>(null);

  useEffect(() => {
    async function fetchBenchmarks() {
      try {
        const res = await fetch('/api/compare-models');
        if (res.ok) {
          const data = await res.json();
          setBenchmarks(data);
          if (data.length > 0) {
            setSelectedModel(data[2]); // Default select EfficientNet-V2
          }
        }
      } catch (err) {
        console.error('Failed to load benchmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBenchmarks();
  }, []);

  return (
    <section className="py-24" id="models">
      <div className="mb-12">
        <h2 className="font-sans text-3xl font-bold text-on-surface tracking-tight">Benchmark Suite</h2>
        <p className="text-sm font-sans text-on-surface-variant mt-1">Compare deep architectural performance across standard ImageNet datasets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comparison table */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col justify-between" id="benchmark-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase pb-4">
                  <th className="pb-3">MODEL ARCHITECTURE</th>
                  <th className="pb-3 text-right">ACCURACY</th>
                  <th className="pb-3 text-right">LATENCY</th>
                  <th className="pb-3 text-right">PARAMETERS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center font-mono text-xs text-on-surface-variant">
                      Querying model parameters...
                    </td>
                  </tr>
                ) : (
                  benchmarks.map((b) => {
                    const isSelected = selectedModel?.name === b.name;
                    return (
                      <tr 
                        key={b.name}
                        onClick={() => setSelectedModel(b)}
                        className={`group cursor-pointer hover:bg-white/[0.02]/30 transition-colors ${isSelected ? 'bg-white/[0.015]' : ''}`}
                      >
                        <td className="py-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all ${
                            b.name === 'MobileNetV2' ? 'bg-primary/10 text-primary' :
                            b.name === 'ResNet50' ? 'bg-secondary/10 text-secondary' :
                            'bg-ai-accent/10 text-ai-accent shadow-[0_0_10px_rgba(228,242,34,0.1)]'
                          }`}>
                            {b.name[0]}
                          </div>
                          <div>
                            <span className="font-medium text-on-surface text-base group-hover:text-primary transition-colors">{b.name}</span>
                            <span className="block text-[10.5px] font-mono text-on-surface-variant/70 truncate max-w-[200px] mt-0.5">{b.type}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className="text-sm font-semibold text-on-surface font-mono">{(b.accuracy * 100).toFixed(1)}%</span>
                            <div className="w-16 bg-[#1f2021] rounded-full h-1 overflow-hidden mt-1">
                              <div className={`h-full rounded-full ${
                                b.name === 'MobileNetV2' ? 'bg-primary' :
                                b.name === 'ResNet50' ? 'bg-secondary' :
                                'bg-ai-accent'
                              }`} style={{ width: `${b.accuracy * 100}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-sm text-on-surface-variant">
                          {b.latency_ms}ms
                        </td>
                        <td className="py-4 text-right font-mono text-xs text-on-surface-variant">
                          {b.parameter_size}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/5 pt-4 mt-6 text-xs text-on-surface-variant/60 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ai-accent animate-pulse"></span>
            Precision testing logs loaded asynchronously based on actual FLOPS footprints.
          </div>
        </div>

        {/* Selected Model Details Panel */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col justify-between" id="benchmark-details">
          {selectedModel ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-on-surface">{selectedModel.name}</h4>
                  <p className="text-xs font-mono text-on-surface-variant mt-0.5">METRIC CARD</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  selectedModel.name === 'EfficientNet-V2' ? 'bg-ai-accent/10 text-ai-accent border border-ai-accent/20' : 'bg-white/5 text-on-surface-variant border border-white/10'
                }`}>
                  {selectedModel.name === 'EfficientNet-V2' ? 'Golden Standard' : 'Evaluation'}
                </span>
              </div>

              <div className="space-y-4 font-sans text-sm text-on-surface">
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Disk Footprint</span>
                  <span className="font-mono font-medium text-on-surface bg-white/5 px-2 py-0.5 rounded text-xs">{selectedModel.model_size_mb} MB</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Confidence Scale</span>
                  <span className="font-mono text-on-surface text-xs text-right truncate max-w-[150px]">{selectedModel.confidence_distribution}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono text-on-surface-variant tracking-wider uppercase block">Core Strengths</span>
                  <ul className="space-y-2 text-xs text-on-surface-variant">
                    {selectedModel.strengths.map((str, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">verified</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">info_outline</span>
              <p className="font-mono text-xs">Select a neural model in the benchmarks list to evaluate its blueprint metrics.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
