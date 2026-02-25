import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getRandomQuestion, submitExerciseResult, getAiExplanationStream,
  generatePracticeQuestion, generateExamReport, generateBatchQuestions,
  type GenerateQuestionParams, type ExamQuestionRecord, type BatchQuestionItem
} from '../api/services/knowledge';
import { QuestionCard, type QuestionData } from '../components/chat/QuestionCard';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ClipboardList, Settings2, Timer, BookOpen, Target, Award, ChevronDown, Brain, Zap, TrendingUp } from 'lucide-react';

interface AudioContextWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const EXAM_TOTAL = 10;
const RW_DOMAINS = ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions'];

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-sm text-slate-700">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

// ── Config Panel ─────────────────────────────────────────────────────────────
interface ConfigPanelProps {
  onGenerate: (params: GenerateQuestionParams, timerSecs: number | null) => void;
  isLoading: boolean;
}

function ConfigPanel({ onGenerate, isLoading }: ConfigPanelProps) {
  const [subject, setSubject] = useState('Reading & Writing');
  const [domain, setDomain] = useState(RW_DOMAINS[0]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [examMode, setExamMode] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMins, setTimerMins] = useState(20);
  const [showHint, setShowHint] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const difficulties = [
    { value: 'Easy',   icon: <BookOpen className="w-4 h-4" />, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'Medium', icon: <Target   className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'Hard',   icon: <Award    className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ];

  const handleGenerate = () => {
    const params: GenerateQuestionParams = {
      subject,
      difficulty,
      domain: subject === 'Reading & Writing' ? domain : undefined,
      source: 'opensat',
      examMode,
      showHint,
    } as GenerateQuestionParams;
    onGenerate(params, timerEnabled ? timerMins * 60 : null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg"><Brain className="w-5 h-5 text-indigo-600" /></div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">SAT Practice</h3>
          <p className="text-xs text-slate-500">Configure your session</p>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Section</label>
        <div className="grid grid-cols-2 gap-2">
          {['Reading & Writing', 'Math'].map(s => (
            <button key={s} onClick={() => setSubject(s)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${subject === s ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s === 'Reading & Writing' ? '📖 ' : '📐 '}{s}
            </button>
          ))}
        </div>
      </div>

      {/* Domain */}
      {subject === 'Reading & Writing' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Domain</label>
          <select value={domain} onChange={e => setDomain(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white">
            {RW_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
        <div className="flex gap-2">
          {difficulties.map(d => (
            <button key={d.value} onClick={() => setDifficulty(d.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-all ${difficulty === d.value ? d.color : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {d.icon}{d.value}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-1">
        <Toggle checked={examMode} onChange={setExamMode} label="Exam Mode (10 questions)" />
        <Toggle checked={showHint} onChange={setShowHint} label="Show hint after answering" />
        <Toggle checked={timerEnabled} onChange={setTimerEnabled} label="Set time limit" />
        {timerEnabled && (
          <div className="pl-1">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Duration</span><span className="font-semibold text-slate-700">{timerMins} min</span>
            </div>
            <input type="range" min={5} max={60} step={5} value={timerMins}
              onChange={e => setTimerMins(Number(e.target.value))}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>5 min</span><span>60 min</span></div>
          </div>
        )}
      </div>

      {/* Advanced */}
      <div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <Settings2 className="w-4 h-4" />Advanced
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        {showAdvanced && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
            R&amp;W questions come from OpenSAT. Math uses OpenSAT first, AI generation as fallback.
          </motion.div>
        )}
      </div>

      {/* Generate */}
      <button onClick={handleGenerate} disabled={isLoading}
        className={`w-full p-4 rounded-xl font-semibold transition-all ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg'}`}>
        {isLoading
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />Loading...</span>
          : <span className="flex items-center justify-center gap-2"><Zap className="w-4 h-4" />Get Question</span>}
      </button>

      <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700"><span className="font-medium">OpenSAT Questions</span> — real SAT questions with AI fallback for Math.</p>
      </div>
    </motion.div>
  );
}

// ── Timer display ─────────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const cb = useRef(onExpire);
  cb.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { cb.current(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const pct = (remaining / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const urgent = remaining <= 60;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${urgent ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-700'}`}>
      <Timer className="w-4 h-4" />
      {mins}:{String(secs).padStart(2, '0')}
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${urgent ? 'bg-red-400' : 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState<QuestionData | null>(null);

  // Batch question pool
  const [batchQuestions, setBatchQuestions] = useState<BatchQuestionItem[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchLoading, setBatchLoading] = useState(false);
  // Track answered state per question index
  const [answeredMap, setAnsweredMap] = useState<Record<number, { isCorrect: boolean; selected: string }>>({});
  const [strategy, setStrategy] = useState('');
  const [strategyCode, setStrategyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentParams, setCurrentParams] = useState<GenerateQuestionParams | null>(null);
  const [streak, setStreak] = useState(0);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const lastSubmitRef = useRef<{ stem: string; selected: string; correct: string } | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Exam mode
  const [examMode, setExamMode] = useState(false);
  const [examRecords, setExamRecords] = useState<ExamQuestionRecord[]>([]);
  const [examAnswered, setExamAnswered] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string | undefined>();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Timer
  const [timerSecs, setTimerSecs] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);

  // Config visibility
  const [configured, setConfigured] = useState(false);

  const loadQuestion = (params?: GenerateQuestionParams, retryCount = 0) => {
    setLoading(true);
    setQuestion(null);
    setExamAnswered(false);
    setTimeExpired(false);

    const paramsToUse = params || currentParams;
    if (params?.domain) setCurrentDomain(params.domain);

    const promise = paramsToUse ? generatePracticeQuestion(paramsToUse) : getRandomQuestion();

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
    }).catch(() => {
      setLoading(false);
      setQuestion({ id: Date.now(), stem: '⚠️ Network error, please retry.', options: ['A. Reload', 'B. Switch network', 'C. Try later', 'D. Contact support'], correctAnswer: 'A', analysis: 'Please check your network connection.' });
      setStrategy('Network Error');
      setStrategyCode('NETWORK_ERROR');
    });
  };

  const showBatchQuestion = (items: BatchQuestionItem[], index: number) => {
    const item = items[index];
    if (!item) return;
    setQuestion({ id: item.id, stem: item.stem, options: item.options, correctAnswer: item.correctAnswer, analysis: item.analysis });
    setStrategy(item.strategyCode === 'OPENSAT' ? 'OpenSAT 真题' : '🤖 AI智能出题');
    setStrategyCode(item.strategyCode);
    setCurrentDomain(item.domain);
    setBatchIndex(index);
  };

  const handleGenerate = (params: GenerateQuestionParams & { examMode?: boolean; showHint?: boolean }, secs: number | null) => {
    setExamMode(!!params.examMode);
    setShowHint(params.showHint !== false);
    setExamRecords([]);
    setExamAnswered(false);
    setAnsweredMap({});
    setTimerSecs(secs);
    setTimerKey(k => k + 1);
    setConfigured(true);
    if (location.pathname === '/practice') {
      navigate('/app/practice', { replace: true });
    }

    const isRW = params.subject === 'Reading & Writing';
    const batchTotal = isRW ? 27 : 22;

    setBatchLoading(true);
    setBatchQuestions([]);
    setBatchIndex(0);
    setQuestion(null);
    startTimeRef.current = Date.now();

    generateBatchQuestions(params.subject, batchTotal)
      .then(items => {
        setBatchQuestions(items);
        setBatchLoading(false);
        if (items.length > 0) {
          showBatchQuestion(items, 0);
          setCurrentParams(params);
        } else {
          // fallback to single question
          loadQuestion(params);
        }
      })
      .catch(() => {
        setBatchLoading(false);
        loadQuestion(params);
      });
  };

  const handleSubmit = async (isCorrect: boolean, selectedOption: string) => {
    if (!question) return;
    try {
      await submitExerciseResult({ studentId: 1, questionId: question.id, isCorrect, duration: 30 });
    } catch { /* ignore */ }

    setAnsweredMap(prev => ({ ...prev, [batchIndex]: { isCorrect, selected: selectedOption } }));

    if (examMode) {
      const record: ExamQuestionRecord = { stem: question.stem, correctAnswer: question.correctAnswer, userAnswer: selectedOption, isCorrect, domain: currentDomain };
      setExamRecords(prev => [...prev, record]);
      setExamAnswered(true);
    }

    lastSubmitRef.current = { stem: question.stem, selected: selectedOption, correct: question.correctAnswer };

    setStreak(prev => {
      const next = isCorrect ? prev + 1 : 0;
      if (isCorrect && next >= 5) { triggerCelebrate(); setShowCelebrate(true); }
      if (!isCorrect) setShowCelebrate(false);
      return next;
    });
  };

  const handleRequestExplanation = () => {
    const info = lastSubmitRef.current;
    if (!info) return;
    setExplanationLoading(true);
    setQuestion(prev => prev ? { ...prev, analysis: '' } : null);
    getAiExplanationStream(
      info.stem, info.selected, info.correct,
      (chunk) => setQuestion(prev => prev ? { ...prev, analysis: (prev.analysis ?? '') + chunk } : null),
      () => setExplanationLoading(false),
      () => {
        setQuestion(prev => prev ? { ...prev, analysis: '❌ AI解析服务暂时繁忙，请重试。' } : null);
        setExplanationLoading(false);
      }
    );
  };

  const handleFinishExam = async () => {
    setGeneratingReport(true);
    const elapsedSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
    const answeredCount = Object.keys(answeredMap).length;
    const correctCount = Object.values(answeredMap).filter(a => a.isCorrect).length;
    try {
      const subject = currentParams?.subject || 'Reading & Writing';
      const records = batchQuestions.map((q, i) => {
        const ans = answeredMap[i];
        return {
          stem: q.stem,
          correctAnswer: q.correctAnswer,
          userAnswer: ans?.selected || '(skipped)',
          isCorrect: ans?.isCorrect || false,
          domain: q.domain,
        };
      });
      const report = await generateExamReport(records, subject);
      navigate('/app/exam-report', { state: { report, elapsedSecs, answeredCount, correctCount, total: batchQuestions.length } });
    } catch { setGeneratingReport(false); }
  };

  const examDone = examMode && examRecords.length >= EXAM_TOTAL;

  if (loading && !question) return <QuestionLoader />;

  // ── Config screen ──
  if (!configured) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Smart Practice</h2>
        <ConfigPanel onGenerate={handleGenerate} isLoading={loading} />
      </div>
    );
  }

  // ── Practice screen ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={() => setConfigured(false)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
          <Settings2 className="w-4 h-4" /> Change Settings
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {timerSecs && !timeExpired && (
            <CountdownTimer key={timerKey} seconds={timerSecs} onExpire={() => setTimeExpired(true)} />
          )}
          {timeExpired && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-600 border border-red-200">⏰ Time's up!</span>
          )}
          {examMode && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
              <ClipboardList className="w-4 h-4" />{examRecords.length}/{EXAM_TOTAL}
            </span>
          )}
          {strategy && (
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${strategyCode === 'OPENSAT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
              {strategyCode === 'OPENSAT' ? '📋 ' : '🤖 '}{strategy}
            </span>
          )}
          {streak > 0 && (
            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-50 text-orange-600">⚡ Combo x{streak}</span>
          )}
        </div>
      </div>

      {/* Progress bar — batch questions */}
      {batchQuestions.length > 0 && (
        <div className="flex gap-1">
          {batchQuestions.map((_, i) => {
            const ans = answeredMap[i];
            const isCurrent = i === batchIndex;
            return (
              <button key={i} onClick={() => showBatchQuestion(batchQuestions, i)}
                className="flex-1 flex flex-col items-center gap-0.5 group">
                <div className={`h-2 w-full rounded-full transition-all duration-300 ${
                  !ans ? (isCurrent ? 'bg-indigo-300' : 'bg-slate-100') : ans.isCorrect ? 'bg-green-400' : 'bg-red-400'
                }`} />
                {ans && (
                  <span className={`text-[10px] font-bold leading-none ${ans.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {ans.isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Question */}
      {(batchLoading && !question) ? <QuestionLoader /> : question && (
        <QuestionCard key={question.id} question={question} onSubmit={handleSubmit} showHint={showHint} onRequestExplanation={handleRequestExplanation} explanationLoading={explanationLoading} />
      )}

      {/* Navigation buttons */}
      {question && batchQuestions.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => showBatchQuestion(batchQuestions, batchIndex - 1)}
            disabled={batchIndex === 0}
            className="px-5 py-2 bg-white text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← 上一题
          </button>
          <span className="text-sm text-slate-500">{batchIndex + 1} / {batchQuestions.length}</span>
          {batchIndex < batchQuestions.length - 1 ? (
            <button
              onClick={() => showBatchQuestion(batchQuestions, batchIndex + 1)}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              下一题 →
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={generatingReport}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg disabled:opacity-60 transition-all"
            >
              {generatingReport ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  生成报告中...
                </span>
              ) : '提交'}
            </button>
          )}
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">准备好提交了吗？</h3>
              <p className="mt-2 text-sm text-slate-500">请仔细检查你的回答，一旦提交，即为最终回答，无法更改。</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4">
              <button onClick={() => setShowSubmitConfirm(false)}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                否，返回
              </button>
              <button onClick={() => { setShowSubmitConfirm(false); handleFinishExam(); }} disabled={generatingReport}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
                是，确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebrate overlay */}
      <AnimatePresence>
        {showCelebrate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="rounded-3xl bg-white/80 px-12 py-8 shadow-2xl backdrop-blur text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <div className="text-2xl font-bold text-indigo-600">Combo x{streak}</div>
              <div className="text-sm text-slate-600">Keep it up!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Loading Screen ────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  { icon: '🔍', text: 'Scanning question bank...' },
  { icon: '🧠', text: 'Analyzing your weak points...' },
  { icon: '⚡', text: 'Calibrating difficulty...' },
  { icon: '✨', text: 'Almost ready...' },
];

function QuestionLoader() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(p => { if (p >= 90) { clearInterval(progressTimer); return p; } return p + (90 - p) * 0.06; });
    }, 120);
    const stepTimer = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 1800);
    return () => { clearInterval(progressTimer); clearInterval(stepTimer); };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-10">
      <div className="relative w-28 h-28">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center text-5xl select-none">🧠</motion.div>
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="absolute w-3.5 h-3.5 rounded-full"
            style={{ background: ['#818cf8', '#34d399', '#fb923c'][i], top: '50%', left: '50%', marginTop: -7, marginLeft: -7 }}
            animate={{ x: [Math.cos((i * 2 * Math.PI) / 3) * 48, Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 48, Math.cos((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 48], y: [Math.sin((i * 2 * Math.PI) / 3) * 48, Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 48, Math.sin((i * 2 * Math.PI) / 3 + 2 * Math.PI) * 48], scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }} />
        ))}
      </div>
      <div className="h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}
            className="flex items-center gap-2 text-slate-600 font-medium">
            <span>{LOADING_STEPS[step].icon}</span><span>{LOADING_STEPS[step].text}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5"><span>Loading question</span><span>{Math.round(progress)}%</span></div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400" style={{ width: `${progress}%` }} transition={{ duration: 0.12 }} />
        </div>
      </div>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <motion.div animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }} className="space-y-3">
          <div className="h-4 bg-slate-100 rounded-full w-3/4" /><div className="h-4 bg-slate-100 rounded-full w-full" /><div className="h-4 bg-slate-100 rounded-full w-5/6" />
        </motion.div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[0,1,2,3].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
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
  osc.type = 'triangle'; osc.frequency.value = 880;
  osc.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.25);
  osc.start(); osc.stop(ctx.currentTime + 0.3);
}
