import React, { useEffect } from 'react';
import { RefreshCwIcon, TrophyIcon } from './icons';
import { fetchNarrationAudio } from '../services/geminiService';
import { playAudio } from '../services/audioService';

interface QuizResultProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({ score, totalQuestions, onRestart }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const getFeedback = () => {
    if (percentage === 100) return "Perfeito! Você é um verdadeiro erudito bíblico!";
    if (percentage >= 70) return "Excelente! Seu conhecimento é impressionante!";
    if (percentage >= 40) return "Bom trabalho! Continue estudando as escrituras.";
    return "Não desanime! Toda jornada de conhecimento começa com um passo.";
  };

  useEffect(() => {
    const narrateResult = async () => {
        const feedbackText = `Quiz Concluído! ${getFeedback()} Você acertou ${score} de ${totalQuestions} perguntas.`;
        const audio = await fetchNarrationAudio(feedbackText);
        playAudio(audio);
    };
    narrateResult();
    // As dependências são estáveis durante a vida útil deste componente,
    // então executamos apenas uma vez na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex justify-center items-center mb-4">
            <TrophyIcon className="w-20 h-20 text-yellow-400" />
        </div>
        <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Quiz Concluído!</h2>
        <p className="text-xl text-slate-300 mb-6">{getFeedback()}</p>
        
        <div className="bg-slate-900/50 p-6 rounded-lg mb-8">
            <p className="text-lg text-slate-400 mb-2">Sua Pontuação Final</p>
            <p className="text-6xl font-bold text-cyan-400">
                {score} <span className="text-3xl text-slate-400">/ {totalQuestions}</span>
            </p>
            <p className="text-2xl font-semibold text-yellow-400 mt-2">{percentage}%</p>
        </div>

        <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-cyan-400/50 transition-all transform hover:scale-105 duration-300"
        >
            <RefreshCwIcon className="w-6 h-6" />
            Jogar Novamente
        </button>
    </div>
  );
};

export default QuizResult;