export interface PredictionRecord {
  id: string;
  image_path: string;
  predicted_class: string;
  confidence: number;
  timestamp: string;
  model_used: string;
}

export interface AnalyticsData {
  total_predictions: number;
  avg_confidence: number;
  most_common_classes: Array<{ class: string; count: number }>;
  daily_usage_stats: Array<{ date: string; count: number }>;
}

export interface SelectedBenchmark {
  name: string;
  type: string;
  accuracy: number;
  latency_ms: number;
  parameter_size: string;
  model_size_mb: number;
  confidence_distribution: string;
  strengths: string[];
}
