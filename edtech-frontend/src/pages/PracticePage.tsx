import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRandomQuestion, submitExerciseResult, getAiExplanation,
  generatePracticeQuestion, generateExamReport,
  type GenerateQuestionParams, type ExamQuestionRecord
} from '../api/services/knowledge';
import { QuestionCard, type QuestionData } from '../components/chat/QuestionCard';
import { PracticeConfigCard } from '../components/practice/PracticeConfigCard';
import { AnimatePresence, motion } from 'framer-motion';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import confetti from 'canvas-confetti';
import { ClipboardList } from 'lucide-react';

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const EXAM_TOTAL = 10;

export default function PracticePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [strategy, setStrategy] = useState<string>('');
  const [strategyCode, setStrategyCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentParams, setCurrentParams] = useState<GenerateQuestionParams | null>(null);
  const [streak, setStreak] = useState(0);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Exam mode state
  const [examMode, setExamMode] = useState(false);
  const [examRecords, setExamRecords] = useState<ExamQuestionRecord[]>([]);
  const [examAnswered, setExamAnswered] = useState(false); // current question answered?
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string | undefined>();

  const loadQuestion = (params?: GenerateQuestionParams, retryCount = 0) => {
    setLoading(true);
    setQuestion(null);
    setExamAnswered(false);

    const paramsToUse = params || currentParams;
    if (params?.domain) setCurrentDomain(params.domain);

    const promise = paramsToUse
      ? generatePracticeQuestion(paramsToUse)
      : getRandomQuestion();

    promise.then(res => {
      if (res.strategyCode === 'ERROR' && retryCount < 2) {
        setTimeout(() => loadQuestion(params, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      setQuestion(res.data);
      setStrategy(res.strategy);
      setStrategyCode(res.strategyCode);
      setLoading(false);
      if (params) setCurrentParams(params);
    }).catch(error => {
      console.error('Question load failed:', error);
      setLoading(false);
      setQuestion({
        id: Date.now(),
        stem: '⚠️ Network error, please retry.',
        options: ['A. Reload', 'B. Switch network', 'C. Try later', 'D. Contact support'],
        correctAnswer: 'A',
        analysis: 'Please check your network connection.'
      });
      setStrategy('Network Error');
      setStrategyCode('NETWORK_ERROR');
    });
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleManualGenerate = (params: GenerateQuestionParams) => {
    if (examMode) {
      // In exam mode, lock params after first question
      loadQuestion(examRecords.length === 0 ? params : undefined);
    } else {
      loadQuestion(params);
    }
  };

  const handleSubmit = async (isCorrect: boolean, selectedOption: string) => {
    if (!question) return;

    try {
      await submitExerciseResult({
        studentId: 1,
        questionId: question.id,
        isCorrect,
        duration: 30
      });
    } catch (e) {
      console.error('Submit failed', e);
    }

    // Record for exam mode
    if (examMode) {
      const record: ExamQuestionRecord = {
        stem: question.stem,
        correctAnswer: question.correctAnswer,
        userAnswer: selectedOption,
        isCorrect,
        domain: currentDomain,
      };
      setExamRecords(prev => [...prev, record]);
      setExamAnswered(true);
    }

    setStreak(prev => {
      const next = isCorrect ? prev + 1 : 0;
      if (isCorrect && next >= 5) {
        triggerCelebrate();
        setShowCelebrate(true);
      }
      if (!isCorrect) setShowCelebrate(false);
      return next;
    });

    if (!isCorrect) {
      setQuestion(prev => prev ? { ...prev, analysis: '🔄 AI generating analysis...' } : null);
      try {
        const exp = await getAiExplanation(question.stem, selectedOption, question.correctAnswer);
        setQuestion(prev => prev ? { ...prev, analysis: exp } : null);
        setExplanation(exp);
        setShowExplanation(true);
      } catch {
        const fallback = '❌ Analysis unavailable, please retry.';
        setQuestion(prev => prev ? { ...prev, analysis: fallback } : null);
        setExplanation(fallback);
        setShowExplanation(true);
      }
    }
  };

  const handleFinishExam = async () => {
    setGeneratingReport(true);
    try {
      const subject = currentParams?.subject || 'Reading & Writing';
      const report = await generateExamReport(examRecords, subject);
      navigate('/exam-report', { state: { report } });
    } catch (e) {
      console.error('Report generation failed:', e);
      setGeneratingReport(false);
    }
  };

  const toggleExamMode = () => {
    setExamMode(prev => !prev);
    setExamRecords([]);
    setExamAnswered(false);
  };

  const examDone = examMode && examRecords.length >= EXAM_TOTAL;

  if (loading && !question) return (
    <div className="max-w-3xl mx-auto space-y-6 p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-64 bg-slate-200 rounded" />
      </div>
      <div className="text-center text-slate-500">Loading question...</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-slate-800">Smart Practice</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Exam mode toggle */}
          <button
            onClick={toggleExamMode}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              examMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            {examMode ? `Exam Mode (${examRecords.length}/${EXAM_TOTAL})` : 'Exam Mode'}
          </button>

          {strategy && (
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
              strategyCode === 'OPENSAT'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : strategyCode === 'CORRECTION_DRILL'
                  ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}>
              {strategyCode === 'OPENSAT' ? '📋 ' : strategyCode === 'CORRECTION_DRILL' ? '🔥 ' : '🤖 '}
              {strategy}
            </span>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 shadow-sm">
              <span>⚡ Combo x{streak}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[320px,1fr] items-start">
        <div className="sticky top-24 self-start">
          <PracticeConfigCard onGenerate={handleManualGenerate} isLoading={loading} />
        </div>

        <div className="space-y-6">
          {question && (
            <QuestionCard question={question} onSubmit={handleSubmit} />
          )}

          {question && (
            <div className="flex justify-end gap-4 flex-wrap">
              {examMode ? (
                examDone ? (
                  <button
                    onClick={handleFinishExam}
                    disabled={generatingReport}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg disabled:opacity-60 transition-all"
                  >
                    {generatingReport ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Generating Report...
                      </span>
                    ) : '📊 View My Report'}
                  </button>
                ) : (
                  examAnswered && (
                    <button
                      onClick={() => loadQuestion()}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Next Question ({examRecords.length}/{EXAM_TOTAL})
                    </button>
                  )
                )
              ) : (
                <>
                  {currentParams && (
                    <button
                      onClick={() => { setCurrentParams(null); loadQuestion(); }}
                      className="px-6 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Switch to Auto Mode
                    </button>
                  )}
                  <button
                    onClick={() => loadQuestion()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {currentParams ? 'Next Targeted Question' : 'Next Question'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCelebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="rounded-3xl bg-white/80 px-12 py-8 shadow-2xl backdrop-blur"
            >
              <div className="space-y-3 text-center">
                <div className="text-4xl">🎉</div>
                <div className="text-2xl font-bold text-indigo-600">Combo x{streak}</div>
                <div className="text-sm text-slate-600">Keep it up!</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExplanation && explanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">AI Explanation</h3>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
              <div className="prose max-w-none text-slate-800">
                <Latex>{explanation}</Latex>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function triggerCelebrate() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
  try { playBeep(); } catch { return; }
}

function playBeep() {
  const win = window as AudioContextWindow;
  const AudioContextCtor = win.AudioContext || win.webkitAudioContext;
  if (!AudioContextCtor) return;
  const ctx = new AudioContextCtor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 880;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}
