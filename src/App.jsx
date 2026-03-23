import { useState, useEffect, useRef } from 'react'
import './App.css'

const cardImages = [
  { "src": "/memory-game-omc/bannane.webp", matched: false },
  { "src": "/memory-game-omc/fraise.webp", matched: false },
  { "src": "/memory-game-omc/framboise.webp", matched: false },
  { "src": "/memory-game-omc/orange.webp", matched: false },
  { "src": "/memory-game-omc/pomme.webp", matched: false },
  { "src": "/memory-game-omc/kiwi.webp", matched: false },
]

function App() {
  const [cards, setCards] = useState([])
  const [turns, setTurns] = useState(0)
  const [choiceOne, setChoiceOne] = useState(null)
  const [choiceTwo, setChoiceTwo] = useState(null)
  const [disabled, setDisabled] = useState(false)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [won, setWon] = useState(false)
  const [bestScore, setBestScore] = useState(
    () => JSON.parse(localStorage.getItem('bestScore')) || null
  )
  const timerRef = useRef(null)

  // ⏱️ Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running])

  // 🔊 Sons
  const playSound = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    if (type === 'match') {
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'win') {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.value = freq
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3)
        o.start(ctx.currentTime + i * 0.15)
        o.stop(ctx.currentTime + i * 0.15 + 0.3)
      })
    } else if (type === 'flip') {
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    }
  }

  const shuffleCards = () => {
    const shuffledCards = [...cardImages, ...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card) => ({ ...card, id: Math.random() }))
    setChoiceOne(null)
    setChoiceTwo(null)
    setCards(shuffledCards)
    setTurns(0)
    setTime(0)
    setRunning(true)
    setWon(false)
  }

  const handleChoice = (card) => {
    playSound('flip')
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card)
  }

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true)
      if (choiceOne.src === choiceTwo.src) {
        playSound('match')
        setCards(prevCards => prevCards.map(card =>
          card.src === choiceOne.src ? { ...card, matched: true } : card
        ))
        resetTurn()
      } else {
        setTimeout(() => resetTurn(), 1000)
      }
    }
  }, [choiceOne, choiceTwo])

  const resetTurn = () => {
    setChoiceOne(null)
    setChoiceTwo(null)
    setTurns(prevTurns => prevTurns + 1)
    setDisabled(false)
  }

  // 🏆 Victoire
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      setRunning(false)
      playSound('win')
      setWon(true)
      // Meilleur score : moins de tours ET moins de temps
      if (!bestScore || turns + 1 < bestScore.turns || 
         (turns + 1 === bestScore.turns && time < bestScore.time)) {
        const newBest = { turns: turns + 1, time }
        setBestScore(newBest)
        localStorage.setItem('bestScore', JSON.stringify(newBest))
      }
    }
  }, [cards])

  useEffect(() => {
    shuffleCards()
  }, [])

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="App">
      <h1>🍓 OMC Memory Game</h1>

      <div className="stats">
        <div className="stat-box">⏱️ {formatTime(time)}</div>
        <button onClick={shuffleCards}>🔄 New Game</button>
        <div className="stat-box">🎯 Turns: {turns}</div>
      </div>

      {bestScore && (
        <div className="best-score">
          🏆 Best: {bestScore.turns} tours en {formatTime(bestScore.time)}
        </div>
      )}

      <div className="card-grid">
        {cards.map(card => (
          <div className="card" key={card.id}>
            <div className={card === choiceOne || card === choiceTwo || card.matched ? "flipped" : ""}>
              <img className="front" src={card.src} alt="card front" />
              <div
                className="back"
                onClick={() => !disabled && card !== choiceOne && handleChoice(card)}
              >
                ?
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🎨 Écran de victoire */}
      {won && (
        <div className="win-overlay">
          <div className="win-box">
            <h2>🎉 Bravo !</h2>
            <p>Tu as gagné en <strong>{turns}</strong> tours</p>
            <p>Temps : <strong>{formatTime(time)}</strong></p>
            {bestScore && <p>🏆 Meilleur score : {bestScore.turns} tours / {formatTime(bestScore.time)}</p>}
            <button onClick={shuffleCards}>🔄 Rejouer</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App