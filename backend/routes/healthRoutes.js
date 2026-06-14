const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: `${Math.floor(process.uptime())}s`,
    metrics: {
      rss: `${Math.round(memory.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100} MB`
    }
  });
});

module.exports = router;
