import React from 'react';
import { TopicId, TopicDef } from '../types';

interface TopicSelectorProps {
  onSelect: (topicId: TopicId) => void;
}

export const TOPICS: TopicDef[] = [
  { id: TopicId.VERBS, name: "Right Form of Verbs", shortName: "VERBS", description: "Correct usage of verbs in context.", allowPassageMode: true },
  { id: TopicId.TRANSFORMATION, name: "Transformation", shortName: "TRANSFORM", description: "Simple, Complex, Compound, Degrees.", allowPassageMode: false },
  { id: TopicId.COMPLETING, name: "Completing Sentences", shortName: "COMPLETE", description: "Finish with logical clauses.", allowPassageMode: false },
  { id: TopicId.NARRATION, name: "Narration", shortName: "NARRATION", description: "Direct and Indirect speech.", allowPassageMode: true },
  { id: TopicId.VOICE, name: "Voice Change", shortName: "VOICE", description: "Active to Passive conversion.", allowPassageMode: false },
  { id: TopicId.PREPOSITION, name: "Appropriate Prepositions", shortName: "PREPOSITION", description: "Fix the correct preposition.", allowPassageMode: true },
  { id: TopicId.ARTICLES, name: "Articles", shortName: "ARTICLES", description: "A, An, The, and Cross (x).", allowPassageMode: true },
];

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase text-white">HSC Grammar</h2>
        <div className="h-1 w-20 bg-white mx-auto mb-4"></div>
        <p className="text-zinc-500 font-mono text-sm tracking-widest">SELECT A TOPIC TO BEGIN PRACTICE</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.id)}
            className="group relative p-8 border border-zinc-800 hover:bg-white hover:border-white text-left transition-all duration-300 bg-black flex flex-col justify-between min-h-[160px]"
          >
            <div className="absolute top-4 right-4 text-zinc-900 group-hover:text-black/10 font-black text-6xl select-none transition-colors">
              {topic.shortName.substring(0, 1)}
            </div>
            
            <div className="relative z-10 mt-auto">
              <h3 className="text-2xl font-bold mb-2 tracking-tight text-white group-hover:text-black uppercase">
                {topic.name}
              </h3>
              <p className="text-xs text-zinc-500 group-hover:text-zinc-600 font-mono uppercase tracking-wider">
                {topic.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;