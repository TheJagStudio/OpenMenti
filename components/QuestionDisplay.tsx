import React from 'react';
import { QuizQuestion } from '../types';

interface QuestionDisplayProps {
    question: QuizQuestion;
    onSelect?: (option: string) => void;
    selectedOption?: string | null;
    showCorrect?: boolean;
    disabled?: boolean;
}

const AnswerOption: React.FC<{
    prefix: string;
    text: string;
    onClick: () => void;
    isCorrect: boolean;
    isSelected: boolean;
    showCorrect: boolean;
    disabled: boolean;
}> = ({ prefix, text, onClick, isCorrect, isSelected, showCorrect, disabled }) => {
    
    const getOptionClass = () => {
        const base = 'border-2 rounded-lg p-4 w-full text-left transition-all duration-200';
        if (showCorrect && isCorrect) return `${base} bg-green-100 border-green-500 text-green-800 font-bold ring-2 ring-green-500`;
        if (isSelected && showCorrect && !isCorrect) return `${base} bg-red-100 border-red-500 text-red-800`;
        if (isSelected) return `${base} bg-blue-100 border-blue-500 text-blue-800 font-bold ring-2 ring-blue-500`;
        if (disabled) return `${base} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
        return `${base} bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 cursor-pointer`;
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={getOptionClass()}
        >
            <span className="font-bold mr-3">{prefix}:</span>
            <span>{text}</span>
        </button>
    );
};


const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, onSelect, selectedOption, showCorrect = false, disabled = false }) => {
    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full bg-white p-6 rounded-lg text-center mb-8">
                 <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{question.question}</h2>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option, index) => (
                    <AnswerOption
                        key={index}
                        prefix={String.fromCharCode(65 + index)}
                        text={option}
                        onClick={() => onSelect && onSelect(option)}
                        isCorrect={option === question.correctAnswer}
                        isSelected={option === selectedOption}
                        showCorrect={showCorrect}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuestionDisplay;