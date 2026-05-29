import React from 'react';
import { PredictionRecord } from '../types.js';

interface RecentPredictionsProps {
  history: PredictionRecord[];
  loading: boolean;
}

export default function RecentPredictions({ history, loading }: RecentPredictionsProps) {
  return (
    <div className="space-y-6" id="predictions-history">
      <div className="flex justify-between items-center">
        <h3 className="font-sans text-xl md:text-2xl font-semibold text-on-surface">Recent Predictions</h3>
        <span className="text-xs font-mono text-on-surface-variant font-medium">REAL-TIME DB FEED</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 glass-panel rounded-xl" id="history-loading">
          <span className="material-symbols-outlined text-primary text-3xl animate-spin mr-3">autorenew</span>
          <span className="font-mono text-sm text-on-surface-variant">Reloading historical layers...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-xl" id="history-empty">
          <span className="material-symbols-outlined text-5xl opacity-20 mb-3">cloud_queue</span>
          <p className="font-mono text-sm text-on-surface-variant">No classification history found. Analyze some entities above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" id="history-grid">
          {history.map((pred) => {
            const formattedConfidence = (pred.confidence * 100).toFixed(1) + '%';
            
            return (
              <div 
                key={pred.id} 
                id={`card-history-${pred.id}`}
                className="glass-panel rounded-xl overflow-hidden group cursor-pointer border border-white/5 bg-white/[0.02] hover:-translate-y-1 transition-transform"
              >
                <div className="h-40 bg-surface-container relative overflow-hidden">
                  <img 
                    referrerPolicy="no-referrer"
                    src={pred.image_path} 
                    alt={pred.predicted_class}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur-md text-[10px] text-ai-accent font-mono font-bold">
                    {formattedConfidence}
                  </div>
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] text-primary font-mono select-none">
                    {pred.model_used || 'VisionAI'}
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low/40">
                  <p className="font-mono font-medium text-[10px] text-on-surface-variant tracking-wider uppercase">CLASS</p>
                  <p className="font-sans text-base text-on-surface font-semibold truncate mt-0.5">{pred.predicted_class}</p>
                  <p className="text-[10px] font-mono text-on-surface-variant/70 mt-1">
                    {new Date(pred.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(pred.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
