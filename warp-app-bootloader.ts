// warp-app-bootloader.ts
import express from 'express';
import { createDailyRoom } from '/Users/as/asoos/backend/api/rest/video/create-room';
import { loadProductCatalog } from '/Users/as/asoos/backend/api/rest/products/load-catalog';

const app = express();
app.use(express.json());

app.post('/api/video/create-room', async (req, res) => {
  const { userId, context } = req.body;
  try {
    const room = await createDailyRoom({ userId, context });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const products = await loadProductCatalog(); // Simulated fetch
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Cannot load products' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile('/Users/as/asoos/academy/frontend/pages/index.html');
});

app.get('/academy', (_req, res) => {
  res.sendFile('/Users/as/asoos/academy/frontend/pages/academy.html');
});

app.get('/gift-shop', (_req, res) => {
  res.sendFile('/Users/as/asoos/academy/frontend/pages/gift-shop.html');
});

app.use('/static', express.static('/Users/as/asoos/academy/frontend/assets'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Warp App running on http://localhost:${PORT}`);
});
