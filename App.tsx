
import React, { useState, useCallback } from 'react';
import { QuizQuestion, QuizState } from './types';
import { fetchBibleQuizQuestions } from './services/geminiService';
import QuestionCard from './components/QuestionCard';
import QuizResult from './components/QuizResult';
import Spinner from './components/Spinner';
import { BookOpenIcon, SparklesIcon } from './components/icons';
import AnimatedBackground from './components/AnimatedBackground';

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>(QuizState.NOT_STARTED);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = useCallback(async () => {
    setQuizState(QuizState.LOADING);
    setError(null);
    try {
      const newQuestions = await fetchBibleQuizQuestions();
      setQuestions(newQuestions);
      setScore(0);
      setCurrentQuestionIndex(0);
      setQuizState(QuizState.IN_PROGRESS);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
      setQuizState(QuizState.ERROR);
    }
  }, []);

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      setQuizState(QuizState.COMPLETED);
    }
  };

  const restartQuiz = () => {
    setQuizState(QuizState.NOT_STARTED);
  };

  const renderContent = () => {
    switch (quizState) {
      case QuizState.LOADING:
        return <div className="text-center">
            <Spinner />
            <p className="mt-4 text-lg text-cyan-300 animate-pulse">Gerando seu quiz... um momento.</p>
        </div>;

      case QuizState.ERROR:
        return <div className="text-center bg-red-900/50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Ocorreu um Erro</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <button
              onClick={startQuiz}
              className="px-6 py-3 bg-yellow-500 text-slate-900 font-bold rounded-lg shadow-lg hover:bg-yellow-400 transition-transform transform hover:scale-105"
            >
              Tentar Novamente
            </button>
        </div>;

      case QuizState.IN_PROGRESS:
        return <QuestionCard
                  questionData={questions[currentQuestionIndex]}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={questions.length}
                  onAnswer={handleAnswer}
                  onNext={handleNextQuestion}
                />;

      case QuizState.COMPLETED:
        return <QuizResult
                  score={score}
                  totalQuestions={questions.length}
                  onRestart={restartQuiz}
                />;
      
      case QuizState.NOT_STARTED:
      default:
        return (
          <div className="text-center p-8 max-w-2xl mx-auto">
            <div className="flex justify-center items-center mb-6">
              <BookOpenIcon className="w-24 h-24 text-yellow-300" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Quiz Bíblico Divino</h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">Teste seus conhecimentos das Escrituras com este desafio celestial gerado por IA!</p>
            <button
              onClick={startQuiz}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-cyan-400/50 transition-all transform hover:scale-105 duration-300"
            >
              <SparklesIcon className="w-6 h-6" />
              Começar o Quiz
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <main className="w-full max-w-3xl">
          {renderContent()}
        </main>
        <footer className="absolute bottom-4 text-xs text-slate-500">
          Gerado com a ajuda da API Gemini.
        </footer>
      </div>
    </>
  );
};

export default App;