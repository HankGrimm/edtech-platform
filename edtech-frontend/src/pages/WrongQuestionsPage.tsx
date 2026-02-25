import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BentoCard } from '../components/ui/BentoCard';
import {
  BookX, Search, Filter, RefreshCw, CheckCircle,
  Clock, AlertTriangle, PieChart as PieChartIcon, CheckCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getMistakeList, getMistakeStats, resolveMistake, type MistakeItem, type MistakeStats } from '../api/services/gamification';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function WrongQuestionsPage() {
  const navigate = useNavigate();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [stats, setStats] = useState<MistakeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedKP, setSelectedKP] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'lastErrorTime' | 'errorCount'>('lastErrorTime');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const userId = Number(localStorage.getItem('userId') || '1');

  async function fetchData() {
    try {
      const [listData, statsData] = await Promise.all([
        getMistakeList(userId, 1, 20, selectedKP || undefined, searchKeyword || undefined, sortBy),
        getMistakeStats(userId)
      ]);
      setMistakes(listData.list);
      setStats(statsData);
    } catch (e) {
      console.error("Failed to load mistakes", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [selectedKP, searchKeyword, sortBy]);

  const handleResolve = async (mistakeId: number) => {
    setResolvingId(mistakeId);
    await resolveMistake(mistakeId);
    setResolvingId(null);
    fetchData();
  };

  const handlePractice = (questionId: number, kpId: number) => {
    navigate(`/practice?questionId=${questionId}&kp=${kpId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <BookX className="h-8 w-8 text-rose-500" />
              智能错题本
            </h1>
            <p className="text-slate-500 mt-1">复习错题，巩固薄弱知识点</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Mistake List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索题目内容..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
            
            <select
              value={selectedKP || ''}
              onChange={(e) => setSelectedKP(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 outline-none"
            >
              <option value="">全部知识点</option>
              {stats?.byKnowledgePoint.map(kp => (
                <option key={kp.knowledgePointId} value={kp.knowledgePointId}>
                  {kp.name} ({kp.value})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'lastErrorTime' | 'errorCount')}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-400 outline-none"
            >
              <option value="lastErrorTime">按时间排序</option>
              <option value="errorCount">按错误次数</option>
            </select>
          </div>

          {/* Mistake Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {mistakes.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">太棒了！没有错题</h3>
                <p className="text-slate-500 mt-2">继续保持，你做得很好！</p>
              </div>
            ) : (
              mistakes.map((mistake) => (
                <motion.div
                  key={mistake.id}
                  variants={itemVariants}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Knowledge Point Tag */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-600">
                          {mistake.knowledgePointName}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-rose-500">
                          <AlertTriangle className="h-3 w-3" />
                          错误 {mistake.errorCount} 次
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(mistake.lastErrorTime).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Question Content */}
                      <div className="text-slate-800 leading-relaxed">
                        <Latex>{mistake.content}</Latex>
                      </div>

                      {/* Options Preview */}
                      {mistake.options && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {(Array.isArray(mistake.options) ? mistake.options : []).slice(0, 4).map((opt: string, i: number) => (
                            <div key={i} className="text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                              <Latex>{opt}</Latex>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Correct Answer */}
                      {mistake.correctAnswer && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm text-green-700 font-medium">正确答案：</span>
                          <span className="text-sm text-green-800"><Latex>{mistake.correctAnswer}</Latex></span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <motion.button
                        onClick={() => handlePractice(mistake.questionId, mistake.knowledgePointId)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RefreshCw className="h-4 w-4" />
                        再练一次
                      </motion.button>
                      <motion.button
                        onClick={() => handleResolve(mistake.id)}
                        disabled={resolvingId === mistake.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all whitespace-nowrap disabled:opacity-60"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCheck className="h-4 w-4" />
                        {resolvingId === mistake.id ? '处理中...' : '标记已掌握'}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Right: Statistics */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats Overview */}
          <BentoCard title="错题统计" icon={<PieChartIcon className="h-5 w-5 text-indigo-500" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <span className="text-2xl font-bold text-rose-600">{stats?.unresolvedCount || 0}</span>
                  <p className="text-xs text-rose-500 mt-1">待复习</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <span className="text-2xl font-bold text-green-600">{stats?.resolvedCount || 0}</span>
                  <p className="text-xs text-green-500 mt-1">已掌握</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="text-3xl font-bold text-slate-700">{stats?.totalMistakes || 0}</span>
                <p className="text-xs text-slate-500 mt-1">总错题数</p>
              </div>
            </div>
          </BentoCard>

          {/* Pie Chart - By Knowledge Point */}
          <BentoCard title="知识点分布" icon={<Filter className="h-5 w-5 text-violet-500" />}>
            {stats && stats.byKnowledgePoint.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byKnowledgePoint}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.byKnowledgePoint.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {stats.byKnowledgePoint.slice(0, 5).map((kp, idx) => (
                    <div 
                      key={kp.knowledgePointId}
                      className="flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
                      onClick={() => setSelectedKP(kp.knowledgePointId)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-sm text-slate-600 truncate">{kp.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-800">{kp.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-slate-400 py-8">暂无数据</p>
            )}
          </BentoCard>

          {/* Quick Actions */}
          <motion.button
            onClick={() => navigate('/practice?mode=mistakes')}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="h-5 w-5" />
            一键复习全部错题
          </motion.button>
        </div>
      </div>
    </div>
  );
}
