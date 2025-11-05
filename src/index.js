import http from 'http';
import { createSajuHandler, createHealthHandler } from './routes/saju.js';

const sajuHandler = createSajuHandler();
const healthHandler = createHealthHandler();

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ message: 'Not Found' }));
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/saju') {
    sajuHandler(req, res);
    return;
  }
  if (req.url === '/healthz') {
    healthHandler(req, res);
    return;
  }
  notFound(res);
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`Manse service listening on port ${PORT}`);
});
