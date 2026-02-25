import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertCircle, BookOpen, Target, ArrowLeft, CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import type { ExamReport } from '../api/services/knowledge';

export default function ExamReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report as ExamReport | undefined;
  const elapsedSecs: number = location.state?.elapsedSecs ?? 0;
  const answeredCount: number = location.state?.answeredCount ?? 0;
  const correctCount: number = location.state?.correctCount ?? 0;
  const total: number = location.state?.total ?? 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  };

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-slate-500 mb-4">暂无报告数据。</p>
        <button onClick={() => navigate('/app/practice')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          返回练习
        </button>
      </div>
    );
  }

  const maxScore = 1600;
  const scorePercent = Math.round((report.total_score / maxScore) * 100);
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/app/practice')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">考试报告</h2>
          <p className="text-sm text-slate-500">AI 个性化分析</p>
        </div>
      </div>

      {/* Stats row: time + answered + accuracy */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center gap-1">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div className="text-xl font-bold text-slate-800">{formatTime(elapsedSecs)}</div>
          <div className="text-xs text-slate-400">用时</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center gap-1">
          <BarChart2 className="w-5 h-5 text-violet-400" />
          <div className="text-xl font-bold text-slate-800">{answeredCount} / {total}</div>
          <div className="text-xs text-slate-400">已作答</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-4 border shadow-sm flex flex-col items-center gap-1 ${accuracy >= 70 ? 'bg-green-50 border-green-200' : accuracy >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <CheckCircle className={`w-5 h-5 ${accuracy >= 70 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-red-400'}`} />
          <div className="text-xl font-bold text-slate-800">{correctCount} / {answeredCount}</div>
          <div className="text-xs text-slate-400">正确率 {accuracy}%</div>
        </motion.div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-3 md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Total Score</span>
          </div>
          <div className="text-5xl font-bold mb-1">{report.total_score}</div>
          <div className="text-sm opacity-75">{report.percentile_estimate}</div>
          {/* Score bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scorePercent}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <div className="text-xs opacity-60 mt-1">{report.total_score} / {maxScore}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-3 md:col-span-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-600">Reading & Writing</span>
          </div>
          <div className="text-4xl font-bold text-slate-800">{report.rw_score}</div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((report.rw_score / 800) * 100)}%` }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">{report.rw_score} / 800</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-3 md:col-span-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-600">Math</span>
          </div>
          <div className="text-4xl font-bold text-slate-800">{report.math_score}</div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((report.math_score / 800) * 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
          <div className="text-xs text-slate-400 mt-1">{report.math_score} / 800</div>
        </motion.div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-slate-800">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 w-2 h-2 rounded-full bg-green-400 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-800">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {report.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Wrong Questions Analysis */}
      {report.wrong_questions_analysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-slate-800">Wrong Questions Analysis</h3>
          </div>
          <div className="space-y-4">
            {report.wrong_questions_analysis.map((item, i) => (
              <div key={i} className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3 mb-2 text-sm">
                  <span className="font-semibold text-slate-700">Q{item.question_index}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                    Your answer: {item.user_answer}
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    Correct: {item.correct}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-1"><span className="font-medium">Why wrong:</span> {item.why_wrong}</p>
                <p className="text-sm text-indigo-700"><span className="font-medium">Key concept:</span> {item.key_concept}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Study Plan */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Personalized Study Plan</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{report.study_plan}</p>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pb-4">
        <button
          onClick={() => navigate('/practice')}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}
