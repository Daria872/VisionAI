import { Router, Request, Response } from 'express';

const router = Router();

export interface ModelMetrics {
  name: string;
  type: string;
  accuracy: number;        // ImageNet Top-1 accuracy
  latency_ms: number;       // average CPU/GPU inference latency
  parameter_size: string;   // parameter weight sizes
  model_size_mb: number;   // disk footprint
  confidence_distribution: string;
  strengths: string[];
}

/**
 * Endpoint 7: GET /compare-models - Returns architectural performance benchmarks
 */
router.get('/compare-models', (req: Request, res: Response) => {
  const benchmarks: ModelMetrics[] = [
    {
      name: "MobileNetV2",
      type: "Lightweight Mobile Convolutional Neural Network (CNN)",
      accuracy: 0.720,
      latency_ms: 45,
      parameter_size: "3.4M",
      model_size_mb: 14,
      confidence_distribution: "Broad / average variance",
      strengths: ["Highly optimized for low resource edge environments", "Extremely low processing latency", "Minimal energy usage"]
    },
    {
      name: "ResNet50",
      type: "Deep Residual Network with Skip Connections",
      accuracy: 0.921,
      latency_ms: 120,
      parameter_size: "25.6M",
      model_size_mb: 98,
      confidence_distribution: "Moderate / sharp peaks",
      strengths: ["Exceptional accuracy stability on common patterns", "Highly standardized pretrains", "Excellent deep feature extraction"]
    },
    {
      name: "EfficientNet-V2",
      type: "Fusing MBConv & Fused-MBConv with Progressive Scaling",
      accuracy: 0.985,
      latency_ms: 85,
      parameter_size: "24M",
      model_size_mb: 92,
      confidence_distribution: "Ultra sharp / precise confidence peaks",
      strengths: ["State-of-the-art accuracy-to-parameter ratio", "Optimized with neural architecture search (NAS)", "Fast parallel batch processing capabilities"]
    }
  ];

  res.json(benchmarks);
});

export default router;
