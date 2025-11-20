
import React, { useState, useEffect, useRef } from 'react';
import { generateQuestion, checkAnswer } from '../services/geminiService';
import { PracticeQuestion, EvaluationResult, TopicId, PracticeModeType, DifficultyLevel } from '../types';
import Button from './Button';
import { TOPICS } from './TopicSelector';

interface PracticeModeProps {
  topicId: TopicId;
  onBack: () => void;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ topicId, onBack }) => {
  const [mode, setMode] = useState<PracticeModeType | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [blinkingId, setBlinkingId] = useState<string | null>(null);

  const topicInfo = TOPICS.find(t => t.id === topicId);
  const hasPassageOption = topicInfo?.allowPassageMode;

  useEffect(() => {
    if (!hasPassageOption && mode === null) {
       // Wait for difficulty selection if needed, or just render default
    }
  }, [hasPassageOption, mode]);

  const loadQuestion = async (selectedMode: PracticeModeType, selectedDiff: DifficultyLevel) => {
    setLoading(true);
    setResult(null);
    setUserAnswers({});
    setQuestion(null);
    setBlinkingId(null);
    
    try {
      const q = await generateQuestion(topicId, selectedMode, selectedDiff);
      setQuestion(q);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (m: PracticeModeType) => {
    setMode(m);
    loadQuestion(m, difficulty);
  };

  const handleAnswerChange = (key: string, val: string) => {
    setUserAnswers(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    try {
      const res = await checkAnswer(question, userAnswers);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (mode) loadQuestion(mode, difficulty);
  };

  const handleSkip = () => {
    if (mode) loadQuestion(mode, difficulty);
  };

  const handleDetailClick = (key: string) => {
    const element = inputRefs.current[key];
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
        setBlinkingId(key);
        setTimeout(() => setBlinkingId(null), 4000);
    }
  };

  // Setup View
  if (!mode) {
    return (
      <div className="max-w-xl w-full mx-auto pt-10 flex flex-col items-center text-center">
        <button onClick={onBack} className="mb-8 text-xs font-mono text-zinc-500 hover:text-white">← BACK</button>
        
        <div className="mb-10 w-full">
             <h2 className="text-sm font-mono text-zinc-500 mb-3 tracking-widest">SELECT DIFFICULTY</h2>
             <div className="flex gap-0 w-full border border-zinc-800">
                {Object.values(DifficultyLevel).map((lvl) => (
                    <button 
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${difficulty === lvl ? 'bg-white text-black' : 'bg-black text-zinc-500 hover:bg-zinc-900'}`}
                    >
                        {lvl}
                    </button>
                ))}
             </div>
        </div>

        <h2 className="text-sm font-mono text-zinc-500 mb-3 tracking-widest">SELECT MODE</h2>
        <div className="grid gap-4 w-full">
            {!hasPassageOption ? (
                 <button onClick={() => handleStart(PracticeModeType.SINGLE)} className="p-8 border border-zinc-800 hover:bg-zinc-900 text-center transition-colors group">
                    <span className="block font-black text-2xl mb-2 group-hover:text-white text-zinc-200">START PRACTICE</span>
                    <span className="block text-xs font-mono text-zinc-500">HSC Standard Questions</span>
                 </button>
            ) : (
                <>
                    <button onClick={() => handleStart(PracticeModeType.SINGLE)} className="p-8 border border-zinc-800 hover:bg-zinc-900 text-center transition-colors group">
                        <span className="block font-black text-2xl mb-2 group-hover:text-white text-zinc-200">SINGLE SENTENCE</span>
                        <span className="block text-xs font-mono text-zinc-500">Quick individual practice</span>
                    </button>
                    <button onClick={() => handleStart(PracticeModeType.PASSAGE)} className="p-8 border border-zinc-800 hover:bg-zinc-900 text-center transition-colors group">
                        <span className="block font-black text-2xl mb-2 group-hover:text-white text-zinc-200">FULL PASSAGE</span>
                        <span className="block text-xs font-mono text-zinc-500">Contextual Board Questions</span>
                    </button>
                </>
            )}
        </div>
      </div>
    );
  }

  if (loading && !question && !result) {
    return (
      <div className="flex justify-center pt-40">
        <span className="font-mono text-sm animate-pulse tracking-widest">GENERATING HSC QUESTION...</span>
      </div>
    );
  }

  if (!question) {
     return <div className="pt-20 text-center"><Button onClick={() => loadQuestion(mode, difficulty)}>RETRY</Button></div>;
  }

  const renderContent = () => {
    if (question.gaps && question.gaps.length > 0) {
        const parts = question.questionText.split(/(\[\d+\](?: \([^)]+\))?)/g);
        
        return (
            <div className={`font-serif text-zinc-300 text-center ${mode === PracticeModeType.PASSAGE ? 'text-lg leading-[3rem]' : 'text-2xl leading-[4rem]'}`}>
                {parts.map((part, idx) => {
                    const match = part.match(/\[(\d+)\](?: \(([^)]+)\))?/);
                    if (match) {
                        const id = match[1];
                        const hint = match[2]; 
                        const isEvaluated = result && result.details && result.details[id];
                        const isCorrect = isEvaluated?.isCorrect;
                        
                        let inputClass = "bg-transparent border-b px-2 py-1 text-center outline-none font-bold transition-all duration-300 inline-block align-baseline ";
                        
                        if (mode === PracticeModeType.PASSAGE) {
                             inputClass += "w-24 md:w-32 mx-1 ";
                        } else {
                             // Match text-2xl size, reasonable width for verbs
                             inputClass += "w-32 md:w-48 text-2xl mx-2 ";
                        }

                        if (isEvaluated) {
                            inputClass += isCorrect ? "border-green-500 text-green-500 " : "border-red-500 text-red-500 line-through ";
                        } else {
                            inputClass += "border-zinc-600 focus:border-white text-white ";
                        }

                        if (blinkingId === id) {
                            inputClass += "animate-blink-focus ";
                        }

                        return (
                            <span key={idx} className="relative inline-block mx-1 group align-baseline">
                                <span className="absolute -top-7 left-0 w-full text-center text-[10px] font-mono text-zinc-500 pointer-events-none select-none">{id}</span>
                                <div className="relative inline-block">
                                    <input
                                        ref={(el) => { inputRefs.current[id] = el; }}
                                        type="text"
                                        value={userAnswers[id] || ''}
                                        onChange={(e) => handleAnswerChange(id, e.target.value)}
                                        className={inputClass}
                                        autoComplete="off"
                                        placeholder={hint || ''}
                                        readOnly={!!result}
                                    />
                                    {/* Inline Correct Answer Badge (Next to input) */}
                                    {isEvaluated && !isCorrect && (
                                        <span className="absolute left-full top-0 bottom-0 my-auto ml-1 flex items-center">
                                             <span className="bg-zinc-900 border border-zinc-700 text-green-400 px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-lg z-10">
                                                {isEvaluated.correctAnswer}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </div>
        );
    }
    
    return (
        <div className="space-y-8 w-full max-w-2xl mx-auto">
             <div className="text-xl md:text-3xl font-bold text-white p-8 border border-zinc-800 bg-black text-center">
                {question.questionText}
            </div>
            <input
                ref={(el) => { inputRefs.current['main'] = el; }}
                type="text"
                autoFocus
                value={userAnswers['main'] || ''}
                onChange={(e) => handleAnswerChange('main', e.target.value)}
                className={`w-full bg-black border p-4 text-white font-mono outline-none text-lg text-center
                    ${result 
                        ? (result.details.main?.isCorrect ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500') 
                        : 'border-zinc-800 focus:border-white'
                    }`}
                placeholder="Type your answer here..."
                readOnly={!!result}
                autoComplete="off"
            />
             {result && !result.details.main?.isCorrect && (
                <div className="text-center">
                     <div className="inline-block border border-green-900 bg-zinc-900 px-4 py-2 text-green-400 font-mono text-sm">
                        CORRECT: {result.details.main?.correctAnswer}
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full pb-20 flex flex-col items-center">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black w-full border-b border-zinc-900 py-4 mb-10 flex justify-center">
        <div className="max-w-4xl w-full px-4 flex items-center justify-between">
            <button onClick={onBack} className="text-xs font-mono text-zinc-500 hover:text-white">← BACK</button>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-tight">{topicInfo?.name}</span>
                <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1 uppercase">{mode}</span>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-4xl px-4 flex flex-col items-center">
        <div className="mb-12 w-full text-center">
            <p className="font-mono text-xs text-zinc-500 mb-8 uppercase tracking-[0.2em] inline-block border-b border-zinc-900 pb-1">{question.instruction}</p>
            {renderContent()}
        </div>

        {!result ? (
            <div className="flex gap-4">
                 <Button type="button" variant="outline" onClick={handleSkip} disabled={loading}>SKIP QUESTION</Button>
                 <Button type="submit" isLoading={loading}>CHECK ANSWER</Button>
            </div>
        ) : (
            <div className="w-full border-t border-zinc-900 pt-12 mt-4">
                <div className="flex flex-col items-center justify-center mb-10 text-center">
                    <h3 className="font-black text-3xl uppercase tracking-tighter mb-2">Result Analysis</h3>
                    <span className={`font-mono text-4xl font-bold ${result.overallScore > 50 ? 'text-green-500' : 'text-red-500'}`}>{result.overallScore}%</span>
                    <p className="text-zinc-400 mt-4 font-serif italic max-w-lg">"{result.overallFeedback}"</p>
                </div>
                
                <div className="grid gap-3 mb-12 max-w-2xl mx-auto w-full">
                    {Object.entries(result.details || {}).map(([key, detail]) => (
                        <button 
                            key={key} 
                            type="button"
                            onClick={() => handleDetailClick(key)}
                            className={`text-left p-6 border transition-all duration-200 group
                                ${detail.isCorrect ? 'border-zinc-900 bg-zinc-950' : 'border-red-900/30 bg-red-950/10'}`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                                    {key === 'main' ? 'Answer' : `Question [${key}]`}
                                </span>
                                {detail.isCorrect ? (
                                    <span className="bg-green-900/20 text-green-500 px-2 py-0.5 text-[10px] font-bold border border-green-900/30">PASSED</span>
                                ) : (
                                    <span className="bg-red-900/20 text-red-500 px-2 py-0.5 text-[10px] font-bold border border-red-900/30">MISSED</span>
                                )}
                            </div>
                            
                            <div className="mb-3">
                                {!detail.isCorrect && (
                                    <div className="mb-1 font-mono text-sm text-zinc-400 line-through decoration-red-500 decoration-2">
                                        {userAnswers[key] || '(empty)'}
                                    </div>
                                )}
                                <div className={`font-bold text-lg ${detail.isCorrect ? 'text-white' : 'text-green-400'}`}>
                                    {detail.correctAnswer}
                                </div>
                            </div>

                            <div className="text-zinc-500 text-sm font-serif border-t border-zinc-800/50 pt-2 mt-2">
                                <span className="text-zinc-600 font-mono text-xs uppercase mr-2">RULE:</span>
                                {detail.explanation.replace(/^Rule: /, '')}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                    <Button type="button" variant="outline" onClick={handleNext}>NEXT QUESTION &rarr;</Button>
                </div>
            </div>
        )}
      </form>
    </div>
  );
};

export default PracticeMode;
