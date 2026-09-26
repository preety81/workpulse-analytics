import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Custom Vite plugin to proxy Google Sheets requests and eliminate CORS & redirect issues
function googleSheetsProxyPlugin(): Plugin {
  return {
    name: 'google-sheets-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy-sheet', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost:5173');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing target url parameter' }));
            return;
          }

          // Fetch target with standard node fetch (handles redirects automatically)
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/csv,text/plain,*/*'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Google Sheets returned HTTP ${response.status}` }));
            return;
          }

          const text = await response.text();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.end(text);
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal proxy error' }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), googleSheetsProxyPlugin()],
});
