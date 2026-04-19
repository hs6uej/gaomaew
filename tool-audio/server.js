const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 4456;
const HISTORY_FILE = path.join(__dirname, 'history.json');

// Helper to fetch HTML content
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    
    // Serve index.html
    if (req.method === 'GET' && parsedUrl.pathname === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }

    // Get History API
    if (req.method === 'GET' && parsedUrl.pathname === '/api/history') {
        fs.readFile(HISTORY_FILE, 'utf8', (err, data) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data || '[]');
        });
        return;
    }

    // Find MP3 API
    if (req.method === 'POST' && parsedUrl.pathname === '/api/find') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { url } = JSON.parse(body);
                if (!url) throw new Error('URL is required');

                console.log(`Searching for: ${url}`);
                const html = await fetchPage(url);
                
                // Regex for og:audio or similar MP3 patterns
                const mp3Match = html.match(/<meta property="og:audio" content="(.*?)"/);
                const directMp3 = mp3Match ? mp3Match[1] : null;

                if (!directMp3) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Could not find MP3 link on this page.' }));
                    return;
                }

                // Save to history
                const historyData = fs.readFileSync(HISTORY_FILE, 'utf8');
                const history = JSON.parse(historyData || '[]');
                
                const newItem = {
                    url,
                    mp3: directMp3,
                    timestamp: new Date().toISOString()
                };
                
                // Add to start, keep last 20
                history.unshift(newItem);
                fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 20), null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
