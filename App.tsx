
import React, { useState } from 'react';
import { AppView, TopicId } from './types';
import PracticeMode from './components/PracticeMode';
import TopicSelector from './components/TopicSelector';
import LearnPage from './components/LearnPage';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [currentTopic, setCurrentTopic] = useState<TopicId | null>(null);

  const handleSelectTopic = (topic: TopicId) => {
    setCurrentTopic(topic);
    setView(AppView.PRACTICE);
  };

  const handleGoHome = () => {
    setView(AppView.HOME);
    setCurrentTopic(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <header className="w-full border-b border-zinc-900 py-5 shrink-0">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="cursor-pointer font-black text-xl tracking-tighter select-none" onClick={handleGoHome}>
            HSC<span className="text-zinc-600">ENGLISH</span>
          </div>
          
          <nav className="flex gap-6 text-xs font-mono tracking-widest">
            <button onClick={() => setView(AppView.HOME)} className={view === AppView.HOME ? 'text-white' : 'text-zinc-500 hover:text-white'}>PRACTICE</button>
            <button onClick={() => setView(AppView.LEARN)} className={view === AppView.LEARN ? 'text-white' : 'text-zinc-500 hover:text-white'}>LEARN</button>
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-6xl">
            {view === AppView.HOME && <TopicSelector onSelect={handleSelectTopic} />}
            {view === AppView.PRACTICE && currentTopic && (
                <PracticeMode topicId={currentTopic} onBack={handleGoHome} />
            )}
            {view === AppView.LEARN && <LearnPage />}
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-8 text-center shrink-0">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          Made with love by Mahamudun Nabi Siam
        </p>
      </footer>
    </div>
  );
};

export default App;