import { useState, useRef, useCallback } from 'react';

const useSpeechRecognition = () => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Detecta soporte real
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Try using Chrome or Edge.');
      return;
    }

    try {
      // Solicita permiso de micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
          .trim()
          .toUpperCase();
        setTranscript(currentTranscript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        let message = '';
        switch (event.error) {
          case 'no-speech':
            message = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            message = 'No microphone found or is blocked.';
            break;
          case 'not-allowed':
            message = 'Microphone access was denied.';
            break;
          default:
            message = `Speech recognition error: ${event.error}`;
        }
        setError(message);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setTranscript('');
      setError(null);
      recognition.start();
      setIsListening(true);
      setAttempts((prev) => prev + 1);
    } catch (err) {
      setError(`Microphone access error: ${err.message}`);
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    attempts,
    startListening,
    stopListening,
    resetAttempts,
  };
};

export default useSpeechRecognition;
