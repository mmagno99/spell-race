import { useState, useRef, useCallback } from 'react';

 const useSpeechRecognition = ({ expectedWords = [] } = {}) => {
   const recognitionRef = useRef(null);
   const [isListening, setIsListening] = useState(false);
   const [transcript, setTranscript] = useState('');
   const [error, setError] = useState(null);
   const [attempts, setAttempts] = useState(0);

   // Verificar la disponibilidad de la API de reconocimiento de voz
   const SpeechRecognition =
     window.SpeechRecognition || window.webkitSpeechRecognition;
   const SpeechGrammarList =
     window.SpeechGrammarList || window.webkitSpeechGrammarList;
   const isSupported = !!SpeechRecognition;

   const startListening = useCallback(async () => {
     if (!isSupported) {
       setError(
         'Speech recognition is not supported in this browser. Try using Chrome or Edge.'
       );
       return;
     }

     try {
       // Solicitar permiso de micrófono
       await navigator.mediaDevices.getUserMedia({ audio: true });

       const recognition = new SpeechRecognition();
       recognition.lang = navigator.language || 'en-US';
       recognition.interimResults = false;
       recognition.continuous = false;
       recognition.maxAlternatives = 3;

       // Opcional: definir gramática si se proveen palabras esperadas
       if (expectedWords.length > 0 && SpeechGrammarList) {
          // Convertimos las palabras esperadas a minúsculas para la gramática,
          // ya que esto suele ser más compatible y no influye en el resultado final que limpiamos.
          const grammarWordsLower = expectedWords.map(word => word.toLowerCase());
          const grammar = `#JSGF V1.0; grammar words; public <word> = ${grammarWordsLower.join(
            ' | '
          )} ;`;
          const speechRecognitionList = new SpeechGrammarList();
          speechRecognitionList.addFromString(grammar, 1);
          recognition.grammars = speechRecognitionList;
       }

       // Manejador para cuando se obtiene un resultado de voz
       recognition.onresult = (event) => {
         // Obtener el texto transcribido del resultado principal
         const recognizedText = event.results[0][0].transcript.trim();

         console.log('Original Recognized Text:', recognizedText); // Debug del texto original

         // Eliminar puntuación común (.,!?;:) usando una expresión regular
         const cleanedText = recognizedText.replace(/[.,!?;:]/g, '');

         console.log('Cleaned Text (no punctuation):', cleanedText); // Debug del texto sin puntuación

         // Convertir el texto limpio a mayúsculas antes de guardarlo
         const uppercaseAndCleanTranscript = cleanedText.toUpperCase();

         console.log('Uppercase and Clean Transcript:', uppercaseAndCleanTranscript); // Debug del texto final

         setTranscript(uppercaseAndCleanTranscript);
         setIsListening(false); // Detener la escucha después de un resultado
       };

       // Manejador para errores
       recognition.onerror = (event) => {
         let message = '';
         switch (event.error) {
           case 'no-speech':
             message = 'No speech was detected. Please try speaking again.';
             break;
           case 'audio-capture':
             message = 'Could not access the microphone. Ensure it is connected and not blocked.';
             break;
           case 'not-allowed':
             message = 'Microphone access was denied by the user.';
             break;
           case 'network':
             message = 'A network error occurred during speech recognition.';
             break;
           case 'service-not-allowed':
             message = 'The speech recognition service is not allowed.';
             break;
           case 'bad-grammar':
             message = 'Speech recognition error: Bad grammar provided.';
             break;
           case 'language-not-supported':
              message = 'Speech recognition error: The language is not supported.';
              break;
           default:
             message = `Speech recognition error: ${event.error}`;
         }
         setError(message);
         setIsListening(false);
       };

       // Manejador para cuando el reconocimiento termina
       recognition.onend = () => {
         setIsListening(false);
       };

        // Si ya existe una instancia de reconocimiento, la detenemos
        if (recognitionRef.current && recognitionRef.current.state !== 'idle') {
            recognitionRef.current.stop();
        }


       // Guardar la nueva instancia en la referencia
       recognitionRef.current = recognition;

       // Resetear estado antes de empezar a escuchar
       setTranscript('');
       setError(null);

       // Iniciar el reconocimiento de voz
       recognition.start();
       setIsListening(true);
       // Incrementar el contador de intentos
       setAttempts((prev) => prev + 1);

     } catch (err) {
       // Capturar errores al solicitar acceso al micrófono
       setError(`Microphone access error: ${err.message}`);
       setIsListening(false);
     }
   }, [isSupported, expectedWords]); // Dependencias del useCallback

   // Función para detener manualmente la escucha
   const stopListening = useCallback(() => {
     if (recognitionRef.current && isListening) {
       recognitionRef.current.stop();
       setIsListening(false);
     }
   }, [isListening]); // Dependencia: isListening

   // Función para resetear el contador de intentos
   const resetAttempts = useCallback(() => {
     setAttempts(0);
   }, []); // No tiene dependencias externas

   // Retornar los valores y funciones que el componente consumidor puede usar
   return {
     isSupported,
     isListening,
     transcript,  // Este transcript ahora estará en MAYÚSCULAS y sin puntuación común
     error,
     attempts,
     startListening,
     stopListening,
     resetAttempts,
   };
 };

 export default useSpeechRecognition;