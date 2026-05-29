import fs from 'fs';
import path from 'path';

export interface PredictionDocument {
  id: string;
  image_path: string;
  predicted_class: string;
  confidence: number;
  timestamp: string;
  model_used: string;
}

const DB_FILE = path.join(process.cwd(), 'predictions_db.json');

// Helper to load predictions from local JSON database
export function loadPredictions(): PredictionDocument[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading predictions database:', error);
  }
  // Initialize with some mock data matching the screenshot if empty
  const initialData: PredictionDocument[] = [
    {
      id: "pred_1",
      image_path: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
      predicted_class: "mountain",
      confidence: 0.985,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      model_used: "EfficientNet-V2"
    },
    {
      id: "pred_2",
      image_path: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
      predicted_class: "sea",
      confidence: 0.962,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      model_used: "MobileNetV2"
    },
    {
      id: "pred_3",
      image_path: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
      predicted_class: "forest",
      confidence: 0.941,
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      model_used: "ResNet50"
    },
    {
      id: "pred_4",
      image_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
      predicted_class: "buildings",
      confidence: 0.992,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      model_used: "EfficientNet-V2"
    }
  ];
  savePredictionsToFile(initialData);
  return initialData;
}

// Helper to save predictions back to local JSON file
export function savePredictionsToFile(predictions: PredictionDocument[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(predictions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving predictions database:', error);
  }
}

export const mongoDb = {
  predictions: {
    find: async (): Promise<PredictionDocument[]> => {
      return loadPredictions();
    },
    insert: async (doc: Omit<PredictionDocument, 'id'>): Promise<PredictionDocument> => {
      const preds = loadPredictions();
      const newDoc: PredictionDocument = {
        ...doc,
        id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      };
      preds.unshift(newDoc); // Add to the front of history
      savePredictionsToFile(preds);
      return newDoc;
    },
    getAnalytics: async () => {
      const preds = loadPredictions();
      const total = preds.length;
      if (total === 0) {
        return {
          total_predictions: 0,
          avg_confidence: 0,
          most_common_classes: [],
          daily_usage_stats: []
        };
      }

      const sumConf = preds.reduce((sum, p) => sum + p.confidence, 0);
      const avgConfidence = sumConf / total;

      // Class frequency
      const classFreq: { [key: string]: number } = {};
      preds.forEach(p => {
        classFreq[p.predicted_class] = (classFreq[p.predicted_class] || 0) + 1;
      });

      const sortedClasses = Object.entries(classFreq)
        .sort((a, b) => b[1] - a[1])
        .map(([className, count]) => ({ class: className, count }));

      // Daily stats (grouped by local-date string YYYY-MM-DD)
      const dailyStats: { [date: string]: number } = {};
      preds.forEach(p => {
        const d = p.timestamp.substring(0, 10);
        dailyStats[d] = (dailyStats[d] || 0) + 1;
      });

      const dailyUsage = Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_predictions: total,
        avg_confidence: avgConfidence,
        most_common_classes: sortedClasses.slice(0, 5),
        daily_usage_stats: dailyUsage
      };
    }
  }
};
