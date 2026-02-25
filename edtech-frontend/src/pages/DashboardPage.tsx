import { motion } from 'framer-motion';
import { BentoCard } from '../components/ui/BentoCard';
import { KnowledgeRadarChart, type KnowledgeStateVO } from '../components/dashboard/KnowledgeRadarChart';
import { Radar, TriangleAlert, Zap, TrendingUp, Flame, Target, Medal, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKnowledgeRadar, getPrediction, type PredictionResult } from '../api/services/knowledge';
import { getTodayGoal, getUserStats, type DailyGoal, type UserStats } from '../api/services/gamification';

// Stagger Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

// Circular Progress Ring Component
function ProgressRing({ progress, size = 120, strokeWidth = 10, color = '#6366f1' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{Math.round(progress)}%</span>
        <span className="text-xs text-slate-500">今日目标</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [radarData, setRadarData] = useState<KnowledgeStateVO[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = Number(localStorage.getItem('userId') || '1');
  const username = localStorage.getItem('username') || '同学';

  useEffect(() => {
    async function fetchData() {
      try {
        const [data, pred, goal, stats] = await Promise.all([
          getKnowledgeRadar(userId),
          getPrediction(userId),
          getTodayGoal(userId),
          getUserStats(userId),
        ]);
        setRadarData(data);
        setPrediction(pred);
        setDailyGoal(goal);
        setUserStats(stats);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const weakPoints = radarData.filter(kp => kp.score < 0.5).slice(0, 3);
  const goalProgress = dailyGoal ? (dailyGoal.completedQuestions / dailyGoal.targetQuestions) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Welcome Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">早上好，{username}！</h1>
            <p className="text-slate-500 mt-1">继续保持，你已经连续学习 <span className="text-indigo-600 font-semibold">{userStats?.currentStreak || 0}</span> 天了！</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {/* Streak Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 px-4 py-2 rounded-2xl">
              <Flame className="h-5 w-5 text-orange-500 fill-current" />
              <span className="font-bold text-orange-600">{userStats?.currentStreak || 0} 天连胜</span>
            </div>
            {/* Points Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 px-4 py-2 rounded-2xl">
              <Medal className="h-5 w-5 text-violet-500" />
              <span className="font-bold text-violet-600">{userStats?.totalPoints || 0} 积分</span>
            </div>
          </div>
        </div>
      </header>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-5 auto-rows-[minmax(160px,auto)]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 1. Today's Goal Progress Ring */}
        <BentoCard className="md:col-span-1 flex flex-col items-center justify-center">
          <ProgressRing progress={Math.min(goalProgress, 100)} />
          <div className="mt-3 text-center">
            <p className="text-sm text-slate-600">
              已完成 <span className="font-semibold text-indigo-600">{dailyGoal?.completedQuestions || 0}</span> / {dailyGoal?.targetQuestions || 10} 题
            </p>
            <button 
              onClick={() => navigate('/daily-goals')}
              className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              调整目标 →
            </button>
          </div>
        </BentoCard>

        {/* 2. Main Stats: Knowledge Radar (Span 2 cols, 2 rows) */}
        <BentoCard 
          className="md:col-span-2 md:row-span-2 min-h-[380px]"
          title="知识掌握雷达"
          icon={<Radar className="h-6 w-6" />}
        >
          <div className="flex h-full items-center justify-center -mt-4">
            <KnowledgeRadarChart data={radarData} />
          </div>
          <p className="text-xs text-slate-400 text-center -mt-2">点击知识点可跳转针对练习</p>
        </BentoCard>

        {/* 3. AI Score Prediction */}
        <BentoCard 
          className="md:col-span-1"
          title="AI 成绩预测"
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
        >
          <div className="flex flex-col items-center justify-center h-full py-2">
            <motion.div 
              className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {prediction ? prediction.predictedScore : '--'}
              <span className="text-lg text-slate-400 font-normal ml-1">分</span>
            </motion.div>
            <p className="text-sm text-slate-500 mt-2">
              置信度: {prediction ? (prediction.confidence * 100).toFixed(0) : 0}%
            </p>
            <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${prediction ? prediction.predictedScore : 0}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </BentoCard>

        {/* 4. Weak Points Alert */}
        <BentoCard 
          className="md:col-span-1"
          title="薄弱点 Top 3"
          icon={<TriangleAlert className="h-5 w-5 text-orange-500" />}
        >
          <div className="space-y-2 mt-1">
            {weakPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4">
                <Target className="h-10 w-10 text-green-400 mb-2" />
                <p className="text-green-600 text-sm font-medium">太棒了！暂无薄弱点</p>
              </div>
            ) : (
              weakPoints.map((kp, idx) => (
                <motion.div 
                  key={kp.knowledgePointId} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/practice?kp=${kp.knowledgePointId}`)}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <span className="text-sm font-medium text-slate-700 truncate">{kp.knowledgePointName}</span>
                  <span className="px-2 py-0.5 text-xs font-bold text-orange-600 bg-orange-100 rounded-full">
                    {(kp.score * 100).toFixed(0)}%
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </BentoCard>

        {/* 5. Today's Recommended Practice */}
        <BentoCard 
          className="md:col-span-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 text-white border-none shadow-lg shadow-indigo-200/50"
        >
          <div className="flex items-center justify-between h-full px-2">
            <div>
              <h3 className="text-xl font-bold">今日推荐练习</h3>
              <p className="text-indigo-100 opacity-90 mt-1">根据你的薄弱点，AI 已为你推荐 5 道针对性练习</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-sm text-indigo-200">
                  <Clock className="h-4 w-4" /> 约 15 分钟
                </span>
                <span className="flex items-center gap-1 text-sm text-indigo-200">
                  <Target className="h-4 w-4" /> 预计 +20 积分
                </span>
              </div>
            </div>
            <motion.button 
              onClick={() => navigate('/practice')}
              className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="h-5 w-5 fill-current" />
              开始智能刷题
            </motion.button>
          </div>
        </BentoCard>

        {/* 6. Quick Stats */}
        <BentoCard className="md:col-span-2">
          <div className="grid grid-cols-4 gap-4 h-full">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800">{userStats?.totalPracticeCount || 0}</span>
              <span className="text-xs text-slate-500 mt-1">总练习题数</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-green-600">
                {userStats && userStats.totalPracticeCount > 0 
                  ? Math.round((userStats.totalCorrectCount / userStats.totalPracticeCount) * 100) 
                  : 0}%
              </span>
              <span className="text-xs text-slate-500 mt-1">正确率</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-violet-600">{userStats?.longestStreak || 0}</span>
              <span className="text-xs text-slate-500 mt-1">最长连胜</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">
                {userStats ? Math.floor(userStats.totalPracticeTime / 60) : 0}h
              </span>
              <span className="text-xs text-slate-500 mt-1">累计学习</span>
            </div>
          </div>
        </BentoCard>

      </motion.div>
    </div>
  );
}
