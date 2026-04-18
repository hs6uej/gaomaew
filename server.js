const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4455;
const HIGHSCORES_FILE = path.join(__dirname, 'data', 'highscores.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(HIGHSCORES_FILE)) {
    fs.writeFileSync(HIGHSCORES_FILE, JSON.stringify([]));
}

// Get high scores
app.get('/api/highscores', (req, res) => {
    try {
        const data = fs.readFileSync(HIGHSCORES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read high scores' });
    }
});

// Save high score
app.post('/api/highscores', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'Name and score are required' });
    }

    try {
        let scores = JSON.parse(fs.readFileSync(HIGHSCORES_FILE, 'utf8'));
        scores.push({ name, score });
        // Sort and keep top 5
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 5);
        
        fs.writeFileSync(HIGHSCORES_FILE, JSON.stringify(scores, null, 2));
        res.json(scores);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save high score' });
    }
});

// Fallback to React index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
