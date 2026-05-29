import { Router, Request, Response } from 'express';
import { mongoDb } from '../database/mongo.js';

const router = Router();

/**
 * Endpoint 6: GET /analytics - Aggregates and returns live classification statistics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const stats = await mongoDb.predictions.getAnalytics();
    res.json(stats);
  } catch (error) {
    console.error('Error computing system analytics:', error);
    res.status(500).json({ error: 'Failed to access predictive analytics.' });
  }
});

export default router;
