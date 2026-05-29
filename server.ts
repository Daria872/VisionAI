import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Import our modular routes with ESM-safe file extensions (.js)
import predictRouter from './server/routes/predict.js';
import historyRouter from './server/routes/history.js';
import analyticsRouter from './server/routes/analytics.js';
import compareRouter from './server/routes/compare.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and urlencoded body payloads up to 50MB (critical for high-res base64 webcam frames)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS headers setup for frontend integrations
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Log all coming classifier request inputs
  app.use((req, res, next) => {
    const tStart = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - tStart;
      if (req.path.startsWith('/api/')) {
        console.log(`[VisionAI API LOG] ${req.method} ${req.path} - RefCount: ${res.statusCode} in ${duration}ms`);
      }
    });
    next();
  });

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'VisionAI Core Backend',
      timestamp: new Date().toISOString(),
      models: ["MobileNetV2", "ResNet50", "EfficientNet-V2"]
    });
  });

  // Mount predicting routers
  app.use('/api', predictRouter);
  app.use('/', predictRouter); // Dual mounting to support both /api/predict-frame and /predict-frame
  app.use('/api', historyRouter);
  app.use('/api', analyticsRouter);
  app.use('/api', compareRouter);

  // Vite static middleware for SPA frontend serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server strictly to host 0.0.0.0 and port 3000 (ingress routing demands 3000)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 VisionAI Production Server Online`);
    console.log(`🌐 Routing active on http://0.0.0.0:${PORT}`);
    console.log(`🧬 GEMINI_API_KEY state: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'UNCONFIGURED (using high-fidelity fallback)'}`);
    console.log(`===============================================`);
  });
}

startServer().catch((error) => {
  console.error('Fatal crash during VisionAI startup:', error);
  process.exit(1);
});
