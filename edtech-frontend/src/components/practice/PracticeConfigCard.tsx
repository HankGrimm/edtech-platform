import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, Zap, Settings, ChevronDown,
  Target, TrendingUp, Award
} from 'lucide-react';
import type { GenerateQuestionParams } from '../../api/services/knowledge';

interface PracticeConfigCardProps {
  onGenerate: (params: GenerateQuestionParams) => void;
  isLoading: boolean;
}

const RW_DOMAINS = [
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions',
];

export function PracticeConfigCard({ onGenerate, isLoading }: PracticeConfigCardProps) {
  const [subject, setSubject] = useState('Reading & Writing');
  const [domain, setDomain] = useState(RW_DOMAINS[0]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const subjects = [
    { value: 'Reading & Writing', label: 'Reading & Writing', icon: '📖' },
    { value: 'Math', label: 'Math', icon: '📐' },
  ];

  const difficulties = [
    {
      value: 'Easy',
      label: 'Easy',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'bg-green-100 text-green-700 border-green-200',
      description: 'Foundational concepts and direct application'
    },
    {
      value: 'Medium',
      label: 'Medium',
      icon: <Target className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      description: 'Moderate challenge with reasoning required'
    },
    {
      value: 'Hard',
      label: 'Hard',
      icon: <Award className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      description: 'Complex multi-step problems'
    },
  ];

  const handleGenerate = () => {
    const params: GenerateQuestionParams = {
      subject,
      difficulty,
      domain: subject === 'Reading & Writing' ? domain : undefined,
      source: 'opensat',
    };
    onGenerate(params);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Brain className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">SAT Practice</h3>
          <p className="text-sm text-slate-500">Real questions from OpenSAT, AI fallback for Math</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((subj) => (
              <button
                key={subj.value}
                onClick={() => setSubject(subj.value)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  subject === subj.value
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">{subj.icon}</span>
                {subj.label}
              </button>
            ))}
          </div>
        </div>

        {/* Domain (R&W only) */}
        {subject === 'Reading & Writing' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {RW_DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
          <div className="space-y-2">
            {difficulties.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setDifficulty(diff.value)}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  difficulty === diff.value
                    ? diff.color
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {diff.icon}
                  <div className="flex-1">
                    <div className="font-medium">{diff.label}</div>
                    <div className="text-xs opacity-75">{diff.description}</div>
                  </div>
                  {difficulty === diff.value && (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-slate-50 rounded-lg"
            >
              <p className="text-xs text-slate-500">
                Math questions are sourced from OpenSAT when available, with AI generation as fallback (marked "[AI生成]").
              </p>
            </motion.div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full p-4 rounded-xl font-semibold transition-all ${
            isLoading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
              Loading question...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Get Question
            </div>
          )}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <div className="font-medium mb-1">OpenSAT Questions</div>
            <div>Reading &amp; Writing questions come directly from the OpenSAT database. Math uses OpenSAT first, with AI generation as fallback.</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
