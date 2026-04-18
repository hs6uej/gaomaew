import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, AlertTriangle, User } from 'lucide-react';
import './App.css';

const API_URL = ''; // Relative to origin

// Sound effect URLs (Public domain/Direct links)
const MEOW_SOUND = "https://www.myinstants.com/media/sounds/cat-meow.mp3";
const HISS_SOUND = "https://www.myinstants.com/media/sounds/hiss.mp3";
const PURR_SOUND = "https://www.myinstants.com/media/sounds/purr.mp3";

function App() {
  const [gameState, setGameState] = useState('IDLE'); // IDLE, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  const [isAlerted, setIsAlerted] = useState(false);
  const [highscores, setHighscores] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isScratched, setIsScratched] = useState(false);
  
  const gameLoopRef = useRef(null);
  const audioMeow = useRef(new Audio(MEOW_SOUND));
  const audioHiss = useRef(new Audio(HISS_SOUND));
  const audioPurr = useRef(new Audio(PURR_SOUND));

  // Fetch Highscores on load
  useEffect(() => {
    fetchHighscores();
  }, []);

  const fetchHighscores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/highscores`);
      const data = await res.json();
      setHighscores(data);
    } catch (err) {
      console.error("Failed to fetch highscores", err);
    }
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setIsAlerted(false);
    audioMeow.current.play().catch(e => console.log("Audio play blocked"));
    startCatLogic();
  };

  const startCatLogic = () => {
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    
    // Difficulty scaling: interval gets shorter as score increases
    const minWait = Math.max(1000, 3000 - score * 50);
    const maxWait = Math.max(2000, 6000 - score * 100);
    const waitTime = Math.random() * (maxWait - minWait) + minWait;

    gameLoopRef.current = setTimeout(() => {
      turnCatHead();
    }, waitTime);
  };

  const turnCatHead = () => {
    setIsAlerted(true);
    audioHiss.current.currentTime = 0;
    audioHiss.current.play().catch(e => console.log("Audio blocked"));
    
    // Duration cat stays looking back
    const alertDuration = 800 + Math.random() * 1200;
    
    setTimeout(() => {
      if (gameState === 'PLAYING') {
        setIsAlerted(false);
        startCatLogic();
      }
    }, alertDuration);
  };

  const handleScratch = () => {
    if (gameState !== 'PLAYING') return;

    if (isAlerted) {
      endGame();
      return;
    }

    setScore(prev => prev + 1);
    setIsScratched(true);
    setTimeout(() => setIsScratched(false), 100);
    
    // Play purr sound occasionally or on every click? Let's do a light purr effect
    if (score % 5 === 0) {
      audioPurr.current.currentTime = 0;
      audioPurr.current.play().catch(e => console.log("Audio blocked"));
    }
  };

  const endGame = () => {
    setGameState('GAME_OVER');
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    audioHiss.current.play().catch(e => console.log("Audio blocked"));
  };

  const submitScore = async () => {
    if (!playerName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/highscores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score })
      });
      const data = await res.json();
      setHighscores(data);
      setGameState('IDLE');
      setPlayerName('');
      setShowLeaderboard(true);
    } catch (err) {
      console.error("Failed to save score", err);
    }
  };

  return (
    <div className="container">
      <header>
        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Kao Maew ! 🐾
        </motion.h1>
        <div className="score-display">
          <span>Score: <b>{score}</b></span>
        </div>
      </header>

      <main className="game-area">
        <AnimatePresence mode="wait">
          {gameState === 'IDLE' && (
            <motion.div 
              className="glass welcome-screen"
              key="idle"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2>พร้อมจะเกาแมวหรือยัง?</h2>
              <p>ระวังนะ! ถ้าแมวหันหน้ามาต้องหยุดเกาทันที!</p>
              <button className="primary-btn" onClick={startGame}>
                <Play size={20} /> เริ่มเกม
              </button>
              <button className="secondary-btn" onClick={() => setShowLeaderboard(!showLeaderboard)}>
                <Trophy size={20} /> อันดับสูงสุด
              </button>
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div 
              className="cat-container"
              key="playing"
              onPointerDown={handleScratch}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div 
                className="cat-sprite"
                animate={{ 
                  scale: isScratched ? 1.05 : 1,
                  rotate: isScratched ? [0, -2, 2, 0] : 0 
                }}
                transition={{ duration: 0.1 }}
              >
                <img 
                  src={isAlerted ? "/cat_alert.png" : "/cat_behind.png"} 
                  alt="Cat" 
                  className="cat-img"
                />
                {isAlerted && (
                  <motion.div 
                    className="alert-cloud"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AlertTriangle color="red" size={48} />
                  </motion.div>
                )}
              </motion.div>
              <div className="hint">แตะที่แมวเพื่อเกา!</div>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div 
              className="glass gameover-screen"
              key="gameover"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2>แมวโกรธแล้ว! 😾</h2>
              <div className="final-score">คุณเกาไปได้ {score} ครั้ง</div>
              <div className="name-input">
                <User size={20} />
                <input 
                  type="text" 
                  placeholder="ใส่ชื่อของคุณ..." 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <button className="primary-btn" onClick={submitScore}>
                บันทึกคะแนน
              </button>
              <button className="secondary-btn" onClick={startGame}>
                <RotateCcw size={20} /> ลองใหม่
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showLeaderboard && (
        <motion.div 
          className="leaderboard-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowLeaderboard(false)}
        >
          <motion.div 
            className="glass leaderboard"
            onClick={e => e.stopPropagation()}
            layoutId="leaderboard"
          >
            <div className="leaderboard-header">
              <Trophy color="gold" />
              <h2>Top 5 คะแนนสูงสุด</h2>
            </div>
            <ul>
              {highscores.map((s, i) => (
                <li key={i} className="highscore-item">
                  <span className="rank">{i + 1}</span>
                  <span className="name">{s.name}</span>
                  <span className="score">{s.score}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowLeaderboard(false)}>ปิด</button>
          </motion.div>
        </motion.div>
      )}

      <footer>
        <p>Created with Love by Antigravity 🐱</p>
      </footer>
    </div>
  );
}

export default App;
