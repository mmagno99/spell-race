
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getRandomWord } from '@/lib/words';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import useGameSound from '@/hooks/useSound';
import useDeviceType from '@/hooks/useDeviceType';
import MicIcon from '@/components/icons/MicIcon';
import PlayerIcon from '@/components/icons/PlayerIcon';
import { Play, Repeat, AlertTriangle, Volume2, VolumeX } from 'lucide-react';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;
const PLAYER_SIZE = 20;
const LETTER_SIZE = 20;
const LETTER_SPEED = 1.5;
const PLAYER_SPEED = 5;
const MAX_ATTEMPTS = 3;

const Game = () => {
  const [gameState, setGameState] = useState('idle');
  const [level, setLevel] = useState(0);
  const [currentWordData, setCurrentWordData] = useState(getRandomWord(0));
  const [collectedLetters, setCollectedLetters] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('spellRacerHighScore') || '0'));
  const [playerPos, setPlayerPos] = useState({ x: 30, y: GAME_HEIGHT / 2 });
  const [letterOnScreen, setLetterOnScreen] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  const gameAreaRef = useRef(null);
  const { toast } = useToast();
  const { transcript, startListening, stopListening, isListening, error: speechError, isSupported: speechSupported, attempts, resetAttempts } = useSpeechRecognition();
  const { playCollectSound, playSuccessSound, playGameOverSound } = useGameSound();
  const { isMobile, isTablet } = useDeviceType();
  
  const gameLoopRef = useRef(null);
  const keyStatesRef = useRef({
    ArrowUp: false,
    ArrowDown: false
  });

  const resetGame = useCallback(() => {
    setLevel(0);
    const newWord = getRandomWord(0);
    setCurrentWordData(newWord);
    setCollectedLetters([]);
    setPlayerPos({ x: 30, y: GAME_HEIGHT / 2 });
    setLetterOnScreen(null);
    resetAttempts();
  }, [resetAttempts]);

  const startGame = () => {
    setScore(0);
    resetGame();
    setGameState('playing');
  };

  const generateLetter = useCallback((char) => {
    const randomY = Math.random() * (GAME_HEIGHT - LETTER_SIZE * 2) + LETTER_SIZE;
    return {
      char,
      x: GAME_WIDTH,
      y: randomY,
      id: `letter-${char}-${Date.now()}`
    };
  }, []);

  const updatePlayerPosition = useCallback(() => {
    if (keyStatesRef.current.ArrowUp) {
      setPlayerPos(prev => ({
        ...prev,
        y: Math.max(PLAYER_SIZE/2, prev.y - PLAYER_SPEED)
      }));
    }
    if (keyStatesRef.current.ArrowDown) {
      setPlayerPos(prev => ({
        ...prev,
        y: Math.min(GAME_HEIGHT - PLAYER_SIZE/2, prev.y + PLAYER_SPEED)
      }));
    }
  }, []);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    updatePlayerPosition();

    if (letterOnScreen) {
      setLetterOnScreen(prev => {
        if (!prev) return null;
        const newX = prev.x - LETTER_SPEED;
        if (newX + LETTER_SIZE < 0) {
          return null;
        }
        return { ...prev, x: newX };
      });
    } else {
      const nextChar = currentWordData.word[collectedLetters.length];
      if (nextChar) {
        setLetterOnScreen(generateLetter(nextChar));
      }
    }

    if (letterOnScreen) {
      const playerRect = {
        x: playerPos.x,
        y: playerPos.y - PLAYER_SIZE/2,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
      };

      const letterRect = {
        x: letterOnScreen.x,
        y: letterOnScreen.y - LETTER_SIZE/2,
        width: LETTER_SIZE,
        height: LETTER_SIZE
      };

      if (
        playerRect.x < letterRect.x + letterRect.width &&
        playerRect.x + playerRect.width > letterRect.x &&
        playerRect.y < letterRect.y + letterRect.height &&
        playerRect.y + playerRect.height > letterRect.y
      ) {
        if (isSoundEnabled) playCollectSound();
        setCollectedLetters(prev => [...prev, letterOnScreen.char]);
        setLetterOnScreen(null);
        setScore(s => s + 10);

        if (collectedLetters.length + 1 === currentWordData.word.length) {
          setGameState('listening');
          toast({ title: "Word Complete!", description: `Speak "${currentWordData.word}" (${MAX_ATTEMPTS - attempts} attempts left)` });
        }
      }
    }

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [gameState, letterOnScreen, playerPos, currentWordData.word, collectedLetters, generateLetter, playCollectSound, toast, attempts, updatePlayerPosition, isSoundEnabled]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'playing' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        keyStatesRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keyStatesRef.current[e.key] = false;
      }
    };

    if (!isMobile && !isTablet) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, isMobile, isTablet]);

  const handleMouseMove = useCallback((e) => {
    if (gameState !== 'playing' || isMobile || isTablet) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setPlayerPos(prev => ({
      ...prev,
      y: Math.max(PLAYER_SIZE/2, Math.min(GAME_HEIGHT - PLAYER_SIZE/2, y))
    }));
  }, [gameState, isMobile, isTablet]);

  const handleTouchMove = useCallback((e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = gameAreaRef.current.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    setPlayerPos(prev => ({
      ...prev,
      y: Math.max(PLAYER_SIZE/2, Math.min(GAME_HEIGHT - PLAYER_SIZE/2, y))
    }));
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'listening' && transcript) {
      if (transcript === currentWordData.word) {
        if (isSoundEnabled) playSuccessSound();
        toast({ title: 'Correct!', description: `You spelled "${currentWordData.word}"`, className: 'bg-green-500 text-white' });
        setScore(s => s + 50);
        
        const newLevel = Math.min(level + 1, 4);
        setLevel(newLevel);
        
        const nextWordData = getRandomWord(newLevel);
        setCurrentWordData(nextWordData);
        setCollectedLetters([]);
        setLetterOnScreen(null);
        resetAttempts();
        setGameState('playing');
      } else {
        if (attempts >= MAX_ATTEMPTS) {
          if (isSoundEnabled) playGameOverSound();
          toast({ title: 'Game Over!', description: `Out of attempts. The word was "${currentWordData.word}"`, variant: 'destructive' });
          setGameState('gameOver');
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('spellRacerHighScore', score.toString());
          }
        } else {
          toast({ 
            title: 'Try Again!', 
            description: `You said "${transcript}", expected "${currentWordData.word}" (${MAX_ATTEMPTS - attempts} attempts left)`,
            variant: 'destructive' 
          });
        }
      }
    }
  }, [transcript, gameState, currentWordData.word, toast, score, highScore, level, playSuccessSound, playGameOverSound, attempts, resetAttempts, isSoundEnabled]);

  const handleMicClick = () => {
    if (!speechSupported) {
      toast({ title: "Speech Not Supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CardTitle className="text-4xl mb-2 text-yellow-300">Spell Racer</CardTitle>
            <CardDescription className="mb-6 text-lg text-gray-200">
              {isMobile || isTablet ? "Touch and drag to move" : "Use arrow keys or mouse to move"}
            </CardDescription>
            <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600 text-2xl py-3 px-6">
              <Play className="mr-2 h-6 w-6" /> Start Game
            </Button>
            <Button onClick={toggleSound} variant="ghost" size="sm" className="mt-4">
              {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        );
      case 'gameOver':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CardTitle className="text-4xl mb-2 text-red-400">Game Over!</CardTitle>
            <CardDescription className="text-xl text-gray-200 mb-1">Your Score: {score}</CardDescription>
            <CardDescription className="text-lg text-gray-300 mb-4">High Score: {highScore}</CardDescription>
            <Button onClick={startGame} size="lg" className="bg-blue-500 hover:bg-blue-600 text-2xl py-3 px-6">
              <Repeat className="mr-2 h-6 w-6" /> Try Again
            </Button>
          </div>
        );
      case 'listening':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CardTitle className="text-3xl mb-2 text-yellow-300">Speak the word:</CardTitle>
            <p className="text-5xl font-bold text-white mb-4 tracking-widest">{currentWordData.word}</p>
            <p className="text-sm text-gray-300 mb-4">Attempts remaining: {MAX_ATTEMPTS - attempts}</p>
            <Button onClick={handleMicClick} size="lg" className={`text-2xl py-3 px-6 ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
              <MicIcon className="mr-2 h-6 w-6" /> {isListening ? 'Listening...' : 'Speak Now'}
            </Button>
            {transcript && <p className="mt-4 text-lg text-gray-200">You said: {transcript}</p>}
            {!speechSupported && <p className="mt-2 text-sm text-red-400 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Speech recognition not supported.</p>}
            {speechError && <p className="mt-2 text-sm text-red-400">Error: {speechError}</p>}
          </div>
        );
      case 'playing':
      default:
        return (
          <>
            <AnimatePresence>
              <motion.div
                key="player"
                style={{
                  position: 'absolute',
                  left: playerPos.x,
                  top: playerPos.y - PLAYER_SIZE/2,
                  width: PLAYER_SIZE,
                  height: PLAYER_SIZE,
                }}
                animate={{
                  top: playerPos.y - PLAYER_SIZE/2
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <PlayerIcon className="text-yellow-400" />
              </motion.div>
            </AnimatePresence>

            {letterOnScreen && (
              <motion.div
                key={letterOnScreen.id}
                style={{
                  position: 'absolute',
                  left: letterOnScreen.x,
                  top: letterOnScreen.y - LETTER_SIZE/2,
                  width: LETTER_SIZE,
                  height: LETTER_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="font-bold text-lg text-green-300 bg-purple-700 rounded-sm p-0.5"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {letterOnScreen.char}
              </motion.div>
            )}

            <div className="absolute top-2 left-2 text-white p-2 bg-black bg-opacity-50 rounded">
              Level: {level + 1} | Score: {score}
            </div>
            <div className="absolute top-2 right-2 text-white p-2 bg-black bg-opacity-50 rounded">
              High Score: {highScore}
            </div>
            <div className="absolute bottom-2 left-2 text-white p-2 bg-black bg-opacity-50 rounded text-sm">
              Word: {currentWordData.word.split('').map((char, idx) => (
                <span key={idx} className={idx < collectedLetters.length ? 'text-green-400' : 'text-gray-500'}>
                  {char}
                </span>
              ))}
            </div>
            {currentWordData.hint && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-300 p-1 bg-black bg-opacity-50 rounded">
                Hint: {currentWordData.hint}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-gray-800 border-gray-700 shadow-2xl overflow-hidden pixelated-font">
      <CardHeader className="pb-2 pt-4 px-4">
        {gameState !== 'idle' && gameState !== 'gameOver' && (
          <div className="flex justify-between items-center mb-1">
            <CardTitle className="text-2xl text-yellow-300">Spell Racer</CardTitle>
            <Button onClick={toggleSound} variant="ghost" size="sm">
              {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={gameAreaRef}
          className="relative bg-blue-700 cursor-pointer"
          style={{ width: '100%', height: GAME_HEIGHT, overflow: 'hidden' }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={(e) => e.preventDefault()}
        >
          {renderGameContent()}
        </div>
      </CardContent>
      {(gameState === 'idle' || gameState === 'gameOver') && (
        <CardFooter className="pt-4 pb-4 px-4 flex-col items-center">
          <p className="text-xs text-gray-400 mt-2">
            Built with React & TailwindCSS. A fun way to learn English words!
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default Game;
