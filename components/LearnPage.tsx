import React, { useState } from 'react';
import Button from './Button';
import { askGrammarQuestion } from '../services/geminiService';

const formatInline = (text: string) => {
  // Split by bold markers **...**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    // Handle single words emphasized with *...* or _..._ if needed, but ** is primary from Gemini
    return part;
  });
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-1 text-base md:text-lg font-sans leading-relaxed text-zinc-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-3" />; // Spacer for paragraphs

        // 1. Headers (#### or ###)
        if (trimmed.startsWith('####')) {
            return <h4 key={idx} className="text-xl font-bold text-white mt-6 mb-3 border-l-4 border-white pl-3">{formatInline(trimmed.replace(/^####\s*/, ''))}</h4>;
        }
        if (trimmed.startsWith('###')) {
            return <h3 key={idx} className="text-2xl font-black text-white mt-8 mb-4 uppercase tracking-tight">{formatInline(trimmed.replace(/^###\s*/, ''))}</h3>;
        }

        // Determine indentation based on leading spaces (rough estimation: 2 spaces = 1 level)
        const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
        const indentClass = leadingSpaces > 4 ? 'ml-8 md:ml-12' : leadingSpaces > 0 ? 'ml-4 md:ml-6' : '';

        // 2. Bullet Points (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return (
                <div key={idx} className={`flex items-start gap-3 mb-2 ${indentClass}`}>
                    <span className="mt-2 w-1.5 h-1.5 bg-zinc-500 rounded-full shrink-0" />
                    <span className="flex-1">{formatInline(trimmed.substring(2))}</span>
                </div>
            );
        }

        // 3. Numbered Lists (1. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
             return (
                <div key={idx} className={`flex items-start gap-3 mb-2 mt-2 ${indentClass}`}>
                    <span className="font-mono text-white font-bold bg-zinc-900 px-2 py-0.5 rounded text-xs border border-zinc-800 mt-0.5 shrink-0">{numMatch[1]}</span>
                    <span className="flex-1">{formatInline(numMatch[2])}</span>
                </div>
            );
        }

        // 4. Regular Paragraphs
        return (
            <p key={idx} className={`mb-1 ${indentClass}`}>
                {formatInline(trimmed)}
            </p>
        );
      })}
    </div>
  );
};

const LearnPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const result = await askGrammarQuestion(query);
      setResponse(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter uppercase text-white">Ask the Teacher</h2>
        <div className="h-1 w-12 bg-white mx-auto mb-4"></div>
        <p className="text-zinc-500 font-mono text-sm tracking-widest">CLEAR CONCEPTS • RULES • EXAMPLES</p>
      </div>

      <form onSubmit={handleAsk} className="w-full mb-10">
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
                <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about grammar... (e.g., 'Explain Right Form of Verbs rules' or 'What is a Modifier?')"
                className="w-full bg-black border border-zinc-800 p-6 text-white text-lg font-sans outline-none focus:border-zinc-500 transition-colors min-h-[120px] resize-none placeholder-zinc-700 shadow-2xl"
                />
                <div className="absolute bottom-4 right-4">
                    <Button type="submit" isLoading={loading} disabled={!query.trim()}>ASK AI</Button>
                </div>
            </div>
        </div>
      </form>

      {response && (
        <div className="w-full animate-fade-in pb-20">
          <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
            <div className="h-8 w-8 bg-white flex items-center justify-center font-black text-black rounded-full text-xs">AI</div>
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">TEACHER'S EXPLANATION</span>
          </div>
          
          <div className="bg-zinc-950/50 p-6 md:p-10 border border-zinc-900 rounded-xl">
            <FormattedText text={response} />
          </div>
        </div>
      )}
      
      {!response && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-center text-zinc-600">
              <div className="border border-zinc-900 p-6 hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer transition-all" onClick={() => setQuery("Explain the rules of 'Right Form of Verbs' with examples.")}>
                  <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-3">TOPIC</span>
                  <h3 className="text-white font-bold">Right Form of Verbs</h3>
              </div>
              <div className="border border-zinc-900 p-6 hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer transition-all" onClick={() => setQuery("What is the difference between Phrase and Clause?")}>
                   <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-3">CONCEPT</span>
                   <h3 className="text-white font-bold">Phrase vs Clause</h3>
              </div>
              <div className="border border-zinc-900 p-6 hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer transition-all" onClick={() => setQuery("How to change Active voice to Passive voice?")}>
                   <span className="font-mono text-[10px] uppercase text-zinc-500 block mb-3">RULE</span>
                   <h3 className="text-white font-bold">Active to Passive</h3>
              </div>
          </div>
      )}
    </div>
  );
};

export default LearnPage;