import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BentoCard } from '../components/ui/BentoCard';
import { 
  Trophy, Medal, Flame, Crown, TrendingUp, Users, Globe, UserCheck
} from 'lucide-react';
import { getWeeklyLeaderboard, getUserRank, type LeaderboardEntry, type LeaderboardData } from '../api/services/gamification';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
        <Crown className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg">
        <Medal className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg">
        <Medal className="h-5 w-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
      <span className="font-bold text-slate-500">{rank}</span>
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
        isMe 
          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200 shadow-md' 
          : 'bg-white hover:bg-slate-50 border border-slate-100'
      }`}
    >
      <RankBadge rank={entry.rank} />
      
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
        {entry.nickname.charAt(0)}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isMe ? 'text-indigo-600' : 'text-slate-800'}`}>
            {entry.nickname}
          </span>
          {isMe && (
            <span className="px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
              我
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Flame className="h-3 w-3 text-orange-400" />
            {entry.weeklyStreak} 天
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <TrendingUp className="h-3 w-3 text-green-400" />
            {entry.weeklyPractice} 题
          </span>
        </div>
      </div>
      
      <div className="text-right">
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          {entry.weeklyPoints}
        </span>
        <p className="text-xs text-slate-400">积分</p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [myRank, setMyRank] = useState<{pointsRank: number; streakRank: number; practiceRank: number; totalPoints: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'points' | 'streak' | 'practice'>('points');
  const [scope, setScope] = useState<'global' | 'friends' | 'class'>('global');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [lb, rank] = await Promise.all([
          getWeeklyLeaderboard(type, 20),
          getUserRank(1)
        ]);
        setLeaderboard(lb);
        setMyRank(rank);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  const currentRank = type === 'points' ? myRank?.pointsRank : 
                      type === 'streak' ? myRank?.streakRank : myRank?.practiceRank;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 pt-4 md:pt-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              周排行榜
            </h1>
            <p className="text-slate-500 mt-1">
              本周: {leaderboard?.weekStart || '--'}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-3">
          {/* Type & Scope Tabs */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Ranking Type */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              {[
                { key: 'points', label: '积分榜', icon: Trophy },
                { key: 'streak', label: '连胜榜', icon: Flame },
                { key: 'practice', label: '练习榜', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setType(key as typeof type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    type === key 
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Scope */}
            <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              {[
                { key: 'global', label: '全球', icon: Globe },
                { key: 'friends', label: '好友', icon: Users },
                { key: 'class', label: '班级', icon: UserCheck },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setScope(key as typeof scope)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    scope === key 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium */}
          {leaderboard && leaderboard.rankings.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mt-22 mb-8 h-52">
              {/* 2nd Place */}
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-2">
                  {leaderboard.rankings[1].nickname.charAt(0)}
                </div>
                <span className="font-medium text-slate-700 text-sm">{leaderboard.rankings[1].nickname}</span>
                <span className="text-lg font-bold text-slate-600">{leaderboard.rankings[1].weeklyPoints}</span>
                <div className="w-20 h-24 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-slate-500">2</span>
                </div>
              </motion.div>
              
              {/* 1st Place */}
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative">
                  <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-6 w-6 text-amber-400 fill-current" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                    {leaderboard.rankings[0].nickname.charAt(0)}
                  </div>
                </div>
                <span className="font-medium text-slate-700 mt-2">{leaderboard.rankings[0].nickname}</span>
                <span className="text-xl font-bold text-amber-600">{leaderboard.rankings[0].weeklyPoints}</span>
                <div className="w-24 h-32 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                  <span className="text-3xl font-bold text-amber-500">1</span>
                </div>
              </motion.div>
              
              {/* 3rd Place */}
              <motion.div 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-lg shadow-lg mb-2">
                  {leaderboard.rankings[2].nickname.charAt(0)}
                </div>
                <span className="font-medium text-slate-700 text-sm">{leaderboard.rankings[2].nickname}</span>
                <span className="text-lg font-bold text-amber-700">{leaderboard.rankings[2].weeklyPoints}</span>
                <div className="w-20 h-16 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-amber-600">3</span>
                </div>
              </motion.div>
            </div>
          )}

          {/* Full List */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {leaderboard?.rankings.slice(3).map(entry => (
              <LeaderboardRow 
                key={entry.userId} 
                entry={entry} 
                isMe={entry.userId === 1}
              />
            ))}
          </motion.div>
        </div>

        {/* Sidebar - My Stats */}
        <div className="lg:col-span-1 space-y-4">
          <BentoCard title="我的排名" icon={<Medal className="h-5 w-5 text-indigo-500" />}>
            <div className="text-center py-4">
              <motion.div 
                className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                #{currentRank || '--'}
              </motion.div>
              <p className="text-slate-500 mt-2">
                {type === 'points' ? '积分' : type === 'streak' ? '连胜' : '练习'} 排名
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className={`p-3 rounded-xl text-center ${type === 'points' ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                <span className="text-lg font-bold text-indigo-600">#{myRank?.pointsRank || 0}</span>
                <p className="text-xs text-slate-500">积分</p>
              </div>
              <div className={`p-3 rounded-xl text-center ${type === 'streak' ? 'bg-orange-100' : 'bg-slate-50'}`}>
                <span className="text-lg font-bold text-orange-600">#{myRank?.streakRank || 0}</span>
                <p className="text-xs text-slate-500">连胜</p>
              </div>
              <div className={`p-3 rounded-xl text-center ${type === 'practice' ? 'bg-green-100' : 'bg-slate-50'}`}>
                <span className="text-lg font-bold text-green-600">#{myRank?.practiceRank || 0}</span>
                <p className="text-xs text-slate-500">练习</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard title="本周数据" icon={<TrendingUp className="h-5 w-5 text-green-500" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl">
                <span className="text-sm text-slate-600">本周积分</span>
                <span className="font-bold text-indigo-600">{myRank?.totalPoints || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                <span className="text-sm text-slate-600">连续天数</span>
                <span className="font-bold text-orange-600">7 天</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <span className="text-sm text-slate-600">完成题数</span>
                <span className="font-bold text-green-600">89 题</span>
              </div>
            </div>
          </BentoCard>

          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 text-white shadow-lg">
            <h3 className="font-bold text-lg">冲刺前三！</h3>
            <p className="text-indigo-100 text-sm mt-1">
              再获得 {Math.max(0, 2180 - (myRank?.totalPoints || 0))} 积分即可进入前三！
            </p>
            <motion.button
              className="mt-4 w-full py-2 bg-white text-indigo-600 rounded-xl font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              开始刷题
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
