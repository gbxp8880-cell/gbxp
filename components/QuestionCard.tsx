import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuizQuestion } from '../types';
import { fetchNarrationAudio, fetchBibleCharacterImage } from '../services/geminiService';
import { playAudio, playTick } from '../services/audioService';
import Spinner from './Spinner';

interface QuestionCardProps {
  questionData: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

const TIMER_SECONDS = 5;

const QuestionCard: React.FC<QuestionCardProps> = ({ questionData, questionNumber, totalQuestions, onAnswer, onNext }) => {
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAnsweredRef = useRef(false);
  const isMountedRef = useRef(true);

  const revealAnswer = useCallback(async (selectedOption: string | null) => {
    if (hasAnsweredRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    hasAnsweredRef.current = true;
    setIsRevealed(true);
    setIsTimerActive(false); // Hide timer when revealing answer
    const isCorrect = selectedOption === questionData.correctAnswer;
    onAnswer(isCorrect);
    
    setIsImageLoading(true);

    const narrationText = isCorrect
      ? "Correto! Muito bem!"
      : `Incorreto. A resposta certa é: ${questionData.correctAnswer}`;
    
    const narrationPromise = fetchNarrationAudio(narrationText).then(playAudio);
    
    const imagePromise = fetchBibleCharacterImage(questionData.correctAnswer)
      .then(base64Image => {
        if (base64Image) {
          setImageUrl(base64Image);
        }
      })
      .catch(error => {
        console.error("Falha ao buscar imagem:", error);
        setImageUrl(null);
      })
      .finally(() => {
        setIsImageLoading(false);
      });
      
    await Promise.allSettled([narrationPromise, imagePromise]);

  }, [onAnswer, questionData.correctAnswer]);

  useEffect(() => {
    isMountedRef.current = true;
    setTimeLeft(TIMER_SECONDS);
    setSelectedAnswer(null);
    setIsRevealed(false);
    hasAnsweredRef.current = false;
    setImageUrl(null);
    setIsImageLoading(false);
    setIsTimerActive(false);

    const startSequence = async () => {
        try {
            const audio = await fetchNarrationAudio(questionData.question);
            // Wait for narration to finish
            await playAudio(audio);
        } catch(error) {
            console.warn("Narration failed, starting timer immediately.", error);
        }

        // Proceed only if the component is still mounted for this question
        if (isMountedRef.current) {
            setIsTimerActive(true);
            timerRef.current = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  return 0;
                }
                playTick();
                return prev - 1;
              });
            }, 1000);
        }
    };
    
    startSequence();

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionData]);

  useEffect(() => {
    if (timeLeft <= 0 && isTimerActive && !hasAnsweredRef.current) {
      revealAnswer(selectedAnswer);
    }
  }, [timeLeft, isTimerActive, revealAnswer, selectedAnswer]);

  const handleSelectAnswer = (option: string) => {
    if (isRevealed || !isTimerActive) return;
    setSelectedAnswer(option);
    revealAnswer(option);
  };
  
  const getButtonClass = (option: string) => {
    if (!isTimerActive && !isRevealed) {
        return 'bg-slate-700 opacity-60 cursor-not-allowed';
    }

    if (!isRevealed) {
        return option === selectedAnswer
            ? 'bg-cyan-500 scale-105 shadow-cyan-400/50'
            : 'bg-slate-700 hover:bg-slate-600';
    }
    
    if (option === questionData.correctAnswer) {
        return 'bg-green-600 animate-pulse';
    }
    
    if (option === selectedAnswer && selectedAnswer !== questionData.correctAnswer) {
        return 'bg-red-600';
    }

    return 'bg-slate-800 opacity-60';
  };

  const timerProgress = (timeLeft / TIMER_SECONDS) * 100;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 md:p-8 rounded-2xl shadow-2xl w-full mx-auto animate-fade-in">
        <div className="mb-6 min-h-[44px]"> {/* Min height to prevent layout shift */}
            <div className="flex justify-between items-center mb-2 text-slate-400">
                <p>Pergunta {questionNumber} de {totalQuestions}</p>
                {isTimerActive && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <div className="w-6 h-6 text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".4"/><path d="M12,6a1,1,0,0,0-1,1v5a1,1,0,0,0,.29.71l3,3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L13,11.59V7A1,1,0,0,0,12,6Z"/></svg>
                        </div>
                        <span className="text-lg font-mono text-yellow-400">{timeLeft}s</span>
                    </div>
                )}
            </div>
            {isTimerActive && (
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 animate-fade-in">
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2.5 rounded-full" style={{ width: `${timerProgress}%`, transition: 'width 0.5s linear' }}></div>
                </div>
            )}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6 text-center">{questionData.question}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {questionData.options.map(option => (
                <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isRevealed || !isTimerActive}
                    className={`p-4 rounded-lg text-lg text-white font-semibold text-left transition-all duration-200 transform disabled:cursor-not-allowed ${getButtonClass(option)}`}
                >
                    {option}
                </button>
            ))}
        </div>

        {isRevealed && (
            <div className="mt-8 pt-6 border-t border-slate-700 text-center animate-fade-in">
                {isImageLoading ? (
                    <div className="flex flex-col items-center">
                        <Spinner />
                        <p className="mt-2 text-slate-400">Gerando uma imagem celestial...</p>
                    </div>
                ) : imageUrl ? (
                    <img src={`data:image/png;base64,${imageUrl}`} alt={questionData.correctAnswer} className="mx-auto h-40 w-40 rounded-lg object-cover mb-4 shadow-lg" />
                ) : (
                    <div className="h-40 w-40 bg-slate-700 rounded-lg mx-auto flex items-center justify-center text-slate-500">
                        <p>Imagem não disponível</p>
                    </div>
                )}
                <button
                    onClick={onNext}
                    className="mt-6 px-8 py-3 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-bold rounded-full shadow-lg hover:shadow-cyan-400/50 transition-transform transform hover:scale-105"
                >
                    {questionNumber === totalQuestions ? 'Ver Resultado' : 'Próxima Pergunta'}
                </button>
            </div>
        )}
    </div>
  );
};

export default QuestionCard;