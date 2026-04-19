import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, AlertTriangle, User } from 'lucide-react';
import './App.css';

const API_URL = ''; // Relative to origin

// Sound effect URLs (Public domain/Direct links)
const MEOW_SOUND = "https://www.myinstants.com/media/sounds/cat-meow.mp3";
const HISS_SOUND = "https://www.myinstants.com/media/sounds/nononono-cat-mp3cut.mp3";
const PURR_SOUND = "https://www.myinstants.com/media/sounds/cat-purr.mp3";

const HairParticle = ({ id, x, y, onComplete }) => {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, rotate: 0 }}
      animate={{
        y: y + 200 + Math.random() * 100,
        x: x + (Math.random() - 0.5) * 100,
        opacity: 0,
        rotate: Math.random() * 360
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '10px',
        height: '2px',
        background: '#f6ad55', // Ginger hair color
        borderRadius: '5px',
        pointerEvents: 'none',
        zIndex: 50
      }}
    />
  );
};

function App() {
  const [gameState, setGameState] = useState('IDLE'); // IDLE, PLAYING, GAME_OVER
  const [score, setScore] = useState(0);
  const [isAlerted, setIsAlerted] = useState(false);
  const [highscores, setHighscores] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isScratched, setIsScratched] = useState(false);
  const [particles, setParticles] = useState([]);

  const lastPos = useRef({ x: 0, y: 0 });
  const totalDist = useRef(0);
  const scoreRef = useRef(0);
  const alertStartTime = useRef(0);

  const gameLoopRef = useRef(null);
  const audioMeow = useRef(new Audio(MEOW_SOUND));
  const audioHiss = useRef(new Audio(HISS_SOUND));
  const audioPurr = useRef(new Audio(PURR_SOUND));

  // Sync scoreRef for async logic
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

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

  // Cat Behavior Logic (Automatic Loop)
  useEffect(() => {
    if (gameState !== 'PLAYING' || isAlerted) return;

    // Use scoreRef to prevent timer reset on every point
    const currentScore = scoreRef.current;
    const minWait = Math.max(1000, 3000 - currentScore * 50);
    const maxWait = Math.max(2000, 6000 - currentScore * 100);
    const waitTime = Math.random() * (maxWait - minWait) + minWait;

    const timer = setTimeout(() => {
      setIsAlerted(true);
      alertStartTime.current = Date.now();
      audioHiss.current.currentTime = 0;
      audioHiss.current.play().catch(e => console.log("Audio blocked"));
    }, waitTime);

    return () => clearTimeout(timer);
  }, [gameState, isAlerted]); // Removed 'score' dependency

  useEffect(() => {
    if (!isAlerted || gameState !== 'PLAYING') return;

    const alertDuration = 800 + Math.random() * 1200;
    const timer = setTimeout(() => {
      setIsAlerted(false);
    }, alertDuration);

    return () => clearTimeout(timer);
  }, [isAlerted, gameState]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    scoreRef.current = 0;
    setIsAlerted(false);
    setIsDragging(false);
    totalDist.current = 0;
    setParticles([]);
    audioMeow.current.play().catch(e => console.log("Audio play blocked"));
  };

  const handlePointerDown = (e) => {
    if (gameState !== 'PLAYING') return;

    // Check grace period on initial click too
    if (isAlerted && (Date.now() - alertStartTime.current > 150)) {
      endGame();
      return;
    }
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const spawnParticles = (x, y) => {
    const newParticles = Array.from({ length: 3 }).map(() => ({
      id: Math.random(),
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40
    }));
    setParticles(prev => [...prev.slice(-20), ...newParticles]);
  };

  const removeParticle = (id) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  };

  const handlePointerMove = (e) => {
    if (!isDragging || gameState !== 'PLAYING') return;

    // Grace Period: 150ms window to react
    if (isAlerted && (Date.now() - alertStartTime.current > 150)) {
      endGame();
      return;
    }

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    totalDist.current += dist;
    lastPos.current = { x: e.clientX, y: e.clientY };

    // Every 50 pixels moved = 1 point
    if (totalDist.current > 50) {
      setScore(prev => prev + 1);
      spawnParticles(e.clientX, e.clientY);
      totalDist.current = 0;
      setIsScratched(true);
      setTimeout(() => setIsScratched(false), 50);

      if (score % 5 === 0) {
        audioPurr.current.currentTime = 0;
        audioPurr.current.play().catch(e => console.log("Audio blocked"));
      }
    }
  };

  const endGame = () => {
    setGameState('GAME_OVER');
    setIsDragging(false);
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

      {particles.map(p => (
        <HairParticle key={p.id} id={p.id} x={p.x} y={p.y} onComplete={removeParticle} />
      ))}

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
              <h2>พร้อมจะหวีขนแมวหรือยัง?</h2>
              <p>ระวังนะ! ถ้าแมวหันหน้ามาต้องหยุดหวีทันที!</p>
              <button className="primary-btn" onClick={startGame}>
                <Play size={20} /> เริ่มหวีเลย
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
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
              <div className="hint">ใช้หวีแปรงขนแมวเลย!</div>
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
              <div className="final-score">คุณหวีขนไปได้ {score} ครั้ง</div>
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
        <p>Created with Love by Macssality 🐱</p>
      </footer>
    </div>
  );
}

export default App;
