import { Router, Request, Response } from 'express';
import { mongoDb } from '../database/mongo.js';

const router = Router();

/**
 * Endpoint 4: GET /history - Fetch previous predictions from the MongoDB simulator
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const list = await mongoDb.predictions.find();
    res.json(list);
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ error: 'Failed to access prediction history database.' });
  }
});

export default router;
