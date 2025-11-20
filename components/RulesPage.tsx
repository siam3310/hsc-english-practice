import React, { useState } from 'react';
import { Rule, TopicId } from '../types';
import { TOPICS } from './TopicSelector';

interface RulesPageProps {
    initialTopic?: TopicId;
}

const RulesPage: React.FC<RulesPageProps> = ({ initialTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(initialTopic || TopicId.VERBS);

  // Data remains same, structure simplified for rendering without anims
  const rulesData: Record<TopicId, Rule[]> = {
    [TopicId.VERBS]: [
        { id: 'v1', topicId: TopicId.VERBS, title: 'Universal Truth', description: 'Present Indefinite for universal truths.', example: 'The sun (rise) -> rises.' },
        { id: 'v2', topicId: TopicId.VERBS, title: 'Past Indication', description: 'Words like yesterday, ago require Past Indefinite.', example: 'He (come) -> came yesterday.' },
        { id: 'v3', topicId: TopicId.VERBS, title: 'Prepositions', description: 'Verb+ing after prepositions (except "to").', example: 'Fond of (read) -> reading.' },
    ],
    [TopicId.TRANSFORMATION]: [
        { id: 't1', topicId: TopicId.TRANSFORMATION, title: 'Too...to -> So...that', description: 'Replace "too" with "so" and "to" with "that + subject + cannot/could not".', example: 'He is too weak to walk -> He is so weak that he cannot walk.' },
    ],
    [TopicId.COMPLETING]: [
        { id: 'c1', topicId: TopicId.COMPLETING, title: 'Lest', description: 'Followed by subject + should/might + base verb.', example: 'Walk fast lest -> you should miss the train.' },
    ],
    [TopicId.NARRATION]: [
        { id: 'n1', topicId: TopicId.NARRATION, title: 'Tense Change', description: 'Present becomes Past. Past Indefinite becomes Past Perfect.', example: 'He said, "I go" -> He said that he went.' },
    ],
    [TopicId.VOICE]: [
        { id: 'vo1', topicId: TopicId.VOICE, title: 'Basic Rule', description: 'Object becomes Subject + Be Verb + V3 + by + Subject.', example: 'I eat rice -> Rice is eaten by me.' },
    ],
    [TopicId.PREPOSITION]: [
        { id: 'p1', topicId: TopicId.PREPOSITION, title: 'Abide by', description: 'To accept or obey.', example: 'Abide by the rules.' },
        { id: 'p2', topicId: TopicId.PREPOSITION, title: 'Absent from', description: 'Not present.', example: 'Absent from the meeting.' },
    ],
    [TopicId.ARTICLES]: [
        { id: 'a1', topicId: TopicId.ARTICLES, title: 'Vowel Sound', description: 'Use "An" before vowel sounds (a, e, i, o, u).', example: 'An honest man.' },
    ],
  };

  const currentRules = rulesData[selectedTopic] || [];

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 mb-8 gap-4">
        <div>
            <h2 className="text-4xl font-bold tracking-tighter uppercase">Rules</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => (
                <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    className={`px-3 py-1 text-xs font-mono border ${selectedTopic === t.id ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                >
                    {t.shortName}
                </button>
            ))}
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {currentRules.map((rule, index) => (
          <div key={rule.id} className="p-6 border border-zinc-800 bg-zinc-950">
            <h3 className="font-bold text-white mb-2 flex justify-between">
                {rule.title}
                <span className="text-zinc-700 font-mono text-xs">#{index + 1}</span>
            </h3>
            <p className="text-zinc-400 text-sm mb-4">{rule.description}</p>
            <div className="bg-zinc-900 p-2 text-xs font-mono text-zinc-300">
              <span className="text-zinc-500 mr-2">EX:</span>{rule.example}
            </div>
          </div>
        ))}
      </div>
      
      {currentRules.length === 0 && (
          <div className="text-center py-20 text-zinc-500 font-mono">
              Select a topic to view rules.
          </div>
      )}
    </div>
  );
};

export default RulesPage;