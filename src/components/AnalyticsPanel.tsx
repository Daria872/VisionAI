import React from 'react';
import { AnalyticsData } from '../types.js';

interface AnalyticsPanelProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

export default function AnalyticsPanel({ analytics, loading }: AnalyticsPanelProps) {
  const totalDisplay = analytics ? analytics.total_predictions : 12800;
  const accuracyDisplay = analytics 
    ? (analytics.avg_confidence * 100).toFixed(1) + '%' 
    : '99.4%';
  const activeModels = 3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-analytics">
      {/* total predictions bento */}
      <div 
        id="card-total-predictions"
        className="glass-panel p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform border border-white/5 bg-white/[0.02]"
        style={{ transform: 'none' }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">analytics</span>
          <span className="text-xs text-primary/60 font-mono tracking-wider">LIVE DATA</span>
        </div>
        <div>
          <div className="font-sans text-4xl md:text-5xl font-bold text-on-surface tracking-tight" id="val-total-predictions">
            {loading ? '...' : totalDisplay.toLocaleString()}
          </div>
          <div className="text-sm font-sans text-on-surface-variant uppercase tracking-wider font-semibold mt-1">Total Predictions</div>
        </div>
      </div>

      {/* average accuracy bento */}
      <div 
        id="card-avg-accuracy"
        className="glass-panel p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform border border-white/5 bg-white/[0.02]"
        style={{ transform: 'none' }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="material-symbols-outlined text-ai-accent text-4xl">verified_user</span>
          <span className="text-xs text-ai-accent/60 font-mono tracking-wider">METRICS</span>
        </div>
        <div>
          <div className="font-sans text-4xl md:text-5xl font-bold text-on-surface tracking-tight" id="val-avg-accuracy">
            {loading ? '...' : accuracyDisplay}
          </div>
          <div className="text-sm font-sans text-on-surface-variant uppercase tracking-wider font-semibold mt-1">Avg. Confidence</div>
        </div>
      </div>

      {/* Active Models bento */}
      <div 
        id="card-active-models"
        className="glass-panel p-8 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform border border-white/5 bg-white/[0.02]"
        style={{ transform: 'none' }}
      >
        <div className="flex justify-between items-start mb-4">
          <span className="material-symbols-outlined text-secondary text-4xl">layers</span>
          <span className="text-xs text-secondary/60 font-mono tracking-wider">SYSTEM</span>
        </div>
        <div>
          <div className="font-sans text-4xl md:text-5xl font-bold text-on-surface tracking-tight" id="val-active-models">
            {activeModels}
          </div>
          <div className="text-sm font-sans text-on-surface-variant uppercase tracking-wider font-semibold mt-1">Active Models</div>
        </div>
      </div>
    </div>
  );
}
