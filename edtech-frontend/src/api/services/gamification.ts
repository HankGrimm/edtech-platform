import request, { ENABLE_MOCK as REQUEST_ENABLE_MOCK } from '../request';

const USE_MOCK = REQUEST_ENABLE_MOCK;

// --- Types ---
export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsReward: number;
  unlocked: boolean;
}

export interface UserAchievementData {
  achievements: Achievement[];
  totalUnlocked: number;
  totalAchievements: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  totalPracticeCount: number;
  totalCorrectCount: number;
  totalPracticeTime: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  nickname: string;
  avatar: string;
  weeklyPoints: number;
  weeklyStreak: number;
  weeklyPractice: number;
}

export interface LeaderboardData {
  type: string;
  weekStart: string;
  rankings: LeaderboardEntry[];
}

export interface DailyGoal {
  id: number;
  userId: number;
  goalDate: string;
  targetQuestions: number;
  targetMinutes: number;
  completedQuestions: number;
  completedMinutes: number;
  isCompleted: number;
  rewardClaimed: number;
}

export interface CalendarDay {
  date: string;
  completed: boolean;
  questionsCompleted: number;
  minutesCompleted: number;
  intensity: number;
}

export interface MistakeItem {
  id: number;
  questionId: number;
  errorCount: number;
  lastErrorTime: string;
  isResolved: number;
  content: string;
  difficulty: number;
  knowledgePointId: number;
  knowledgePointName: string;
  options: any;
  correctAnswer: string;
}

export interface MistakeStats {
  totalMistakes: number;
  resolvedCount: number;
  unresolvedCount: number;
  byKnowledgePoint: { name: string; value: number; knowledgePointId: number }[];
}

// --- Mock Data ---
const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 1, code: 'FIRST_BLOOD', name: '初试锋芒', description: '完成第一道练习题', icon: 'zap', category: 'practice', rarity: 'common', pointsReward: 10, unlocked: true },
  { id: 2, code: 'STREAK_3', name: '小小坚持', description: '连续学习3天', icon: 'flame', category: 'streak', rarity: 'common', pointsReward: 30, unlocked: true },
  { id: 3, code: 'STREAK_7', name: '周周进步', description: '连续学习7天', icon: 'flame', category: 'streak', rarity: 'rare', pointsReward: 70, unlocked: true },
  { id: 4, code: 'STREAK_30', name: '月度学霸', description: '连续学习30天', icon: 'flame', category: 'streak', rarity: 'epic', pointsReward: 300, unlocked: false },
  { id: 5, code: 'PRACTICE_50', name: '勤学苦练', description: '累计完成50道题', icon: 'book-open', category: 'practice', rarity: 'common', pointsReward: 50, unlocked: true },
  { id: 6, code: 'PRACTICE_100', name: '百题斩', description: '累计完成100道题', icon: 'book-open', category: 'practice', rarity: 'rare', pointsReward: 100, unlocked: false },
  { id: 7, code: 'MASTERY_1', name: '初露头角', description: '首次掌握一个知识点', icon: 'medal', category: 'mastery', rarity: 'common', pointsReward: 20, unlocked: true },
  { id: 8, code: 'ACCURACY_90', name: '精准射手', description: '单次练习正确率达90%', icon: 'target', category: 'accuracy', rarity: 'rare', pointsReward: 80, unlocked: false },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 101, nickname: '学霸小王', avatar: '/avatars/1.png', weeklyPoints: 2580, weeklyStreak: 14, weeklyPractice: 156 },
  { rank: 2, userId: 102, nickname: '努力小李', avatar: '/avatars/2.png', weeklyPoints: 2340, weeklyStreak: 12, weeklyPractice: 142 },
  { rank: 3, userId: 103, nickname: '数学达人', avatar: '/avatars/3.png', weeklyPoints: 2180, weeklyStreak: 10, weeklyPractice: 128 },
  { rank: 4, userId: 1, nickname: '小明同学', avatar: '/avatars/default.png', weeklyPoints: 1250, weeklyStreak: 7, weeklyPractice: 89 },
  { rank: 5, userId: 104, nickname: '勤奋小张', avatar: '/avatars/4.png', weeklyPoints: 1120, weeklyStreak: 5, weeklyPractice: 76 },
];

// --- API Services ---

export async function getUserAchievements(userId: number): Promise<UserAchievementData> {
  if (USE_MOCK) {
    return {
      achievements: MOCK_ACHIEVEMENTS,
      totalUnlocked: MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length,
      totalAchievements: MOCK_ACHIEVEMENTS.length,
      totalPoints: 1250,
      currentStreak: 7,
      longestStreak: 15,
    };
  }
  try {
    const res = await request.get<UserAchievementData>(`/achievement/user/${userId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch achievements failed", e);
    return {
      achievements: MOCK_ACHIEVEMENTS,
      totalUnlocked: 5,
      totalAchievements: 8,
      totalPoints: 1250,
      currentStreak: 7,
      longestStreak: 15,
    };
  }
}

export async function getUserStats(userId: number): Promise<UserStats> {
  if (USE_MOCK) {
    return {
      totalPoints: 1250,
      currentStreak: 7,
      longestStreak: 15,
      totalPracticeCount: 156,
      totalCorrectCount: 128,
      totalPracticeTime: 420,
    };
  }
  try {
    const res = await request.get<UserStats>(`/achievement/stats/${userId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch stats failed", e);
    return { totalPoints: 0, currentStreak: 0, longestStreak: 0, totalPracticeCount: 0, totalCorrectCount: 0, totalPracticeTime: 0 };
  }
}

export async function getWeeklyLeaderboard(type: string = 'points', limit: number = 50): Promise<LeaderboardData> {
  if (USE_MOCK) {
    return { type, weekStart: '2024-12-09', rankings: MOCK_LEADERBOARD };
  }
  try {
    const res = await request.get<LeaderboardData>('/leaderboard/weekly', { params: { type, limit } });
    return res.data;
  } catch (e) {
    console.error("Fetch leaderboard failed", e);
    return { type, weekStart: '', rankings: MOCK_LEADERBOARD };
  }
}

export async function getUserRank(userId: number) {
  if (USE_MOCK) {
    return { pointsRank: 4, streakRank: 3, practiceRank: 4, totalPoints: 1250, currentStreak: 7, totalPractice: 89 };
  }
  try {
    const res = await request.get(`/leaderboard/rank/${userId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch rank failed", e);
    return { pointsRank: 0, streakRank: 0, practiceRank: 0 };
  }
}

export async function getTodayGoal(userId: number): Promise<DailyGoal> {
  if (USE_MOCK) {
    return {
      id: 1, userId, goalDate: new Date().toISOString().split('T')[0],
      targetQuestions: 15, targetMinutes: 30,
      completedQuestions: 8, completedMinutes: 18,
      isCompleted: 0, rewardClaimed: 0
    };
  }
  try {
    const res = await request.get<DailyGoal>(`/daily-goal/today/${userId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch daily goal failed", e);
    return { id: 0, userId, goalDate: '', targetQuestions: 10, targetMinutes: 30, completedQuestions: 0, completedMinutes: 0, isCompleted: 0, rewardClaimed: 0 };
  }
}

export async function updateDailyGoal(userId: number, targetQuestions?: number, targetMinutes?: number): Promise<DailyGoal> {
  if (USE_MOCK) {
    return { id: 1, userId, goalDate: new Date().toISOString().split('T')[0], targetQuestions: targetQuestions || 10, targetMinutes: targetMinutes || 30, completedQuestions: 8, completedMinutes: 18, isCompleted: 0, rewardClaimed: 0 };
  }
  const res = await request.post<DailyGoal>('/daily-goal/update', { userId, targetQuestions, targetMinutes });
  return res.data;
}

export async function getCalendarData(userId: number, days: number = 90): Promise<CalendarDay[]> {
  if (USE_MOCK) {
    const data: CalendarDay[] = [];
    const today = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const intensity = Math.random() > 0.3 ? Math.floor(Math.random() * 5) : 0;
      data.push({
        date: date.toISOString().split('T')[0],
        completed: intensity >= 4,
        questionsCompleted: intensity * 3,
        minutesCompleted: intensity * 8,
        intensity,
      });
    }
    return data;
  }
  try {
    const res = await request.get<CalendarDay[]>(`/daily-goal/calendar/${userId}`, { params: { days } });
    return res.data;
  } catch (e) {
    console.error("Fetch calendar failed", e);
    return [];
  }
}

export async function resolveMistake(mistakeId: number): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    return { success: true, message: '已标记为掌握' };
  }
  try {
    const res = await request.post<{ success: boolean; message: string }>(`/mistakes/resolve/${mistakeId}`);
    return res.data;
  } catch (e) {
    console.error("Resolve mistake failed", e);
    return { success: false, message: '操作失败' };
  }
}

export async function getMistakeList(studentId: number, page = 1, size = 10, knowledgePointId?: number, keyword?: string, sortBy?: string) {
  if (USE_MOCK) {
    const mockMistakes: MistakeItem[] = [
      { id: 1, questionId: 101, errorCount: 3, lastErrorTime: '2024-12-13T10:30:00', isResolved: 0, content: '若 $\\sin \\alpha = \\frac{1}{3}$，则 $\\cos^2 \\alpha = ?$', difficulty: 0.6, knowledgePointId: 2, knowledgePointName: '三角函数', options: ['A. 8/9', 'B. 1/9', 'C. 2/3', 'D. 1/3'], correctAnswer: 'A' },
      { id: 2, questionId: 102, errorCount: 2, lastErrorTime: '2024-12-12T14:20:00', isResolved: 0, content: '已知等差数列 {$a_n$} 的首项 $a_1 = 2$，公差 $d = 3$，求 $S_{10}$', difficulty: 0.5, knowledgePointId: 3, knowledgePointName: '数列', options: ['A. 155', 'B. 165', 'C. 175', 'D. 185'], correctAnswer: 'B' },
      { id: 3, questionId: 103, errorCount: 5, lastErrorTime: '2024-12-11T09:15:00', isResolved: 0, content: '求过点 $(1, 2)$ 且与直线 $2x - y + 1 = 0$ 平行的直线方程', difficulty: 0.4, knowledgePointId: 5, knowledgePointName: '解析几何', options: ['A. 2x - y = 0', 'B. 2x - y - 1 = 0', 'C. x - 2y + 3 = 0', 'D. 2x + y - 4 = 0'], correctAnswer: 'A' },
    ];
    return { list: mockMistakes, total: 15, page, size };
  }
  try {
    const res = await request.get(`/mistakes/list/${studentId}`, { params: { page, size, knowledgePointId, keyword, sortBy } });
    return res.data;
  } catch (e) {
    console.error("Fetch mistakes failed", e);
    return { list: [], total: 0, page, size };
  }
}

export async function getMistakeStats(studentId: number): Promise<MistakeStats> {
  if (USE_MOCK) {
    return {
      totalMistakes: 15,
      resolvedCount: 5,
      unresolvedCount: 10,
      byKnowledgePoint: [
        { name: '三角函数', value: 5, knowledgePointId: 2 },
        { name: '解析几何', value: 4, knowledgePointId: 5 },
        { name: '立体几何', value: 3, knowledgePointId: 4 },
        { name: '数列', value: 2, knowledgePointId: 3 },
        { name: '概率统计', value: 1, knowledgePointId: 6 },
      ]
    };
  }
  try {
    const res = await request.get<MistakeStats>(`/mistakes/stats/${studentId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch mistake stats failed", e);
    return { totalMistakes: 0, resolvedCount: 0, unresolvedCount: 0, byKnowledgePoint: [] };
  }
}

export async function getChildDetail(childId: number) {
  if (USE_MOCK) {
    return {
      nickname: '小明同学',
      avatar: '/avatars/default.png',
      grade: '高三',
      totalPoints: 1250,
      currentStreak: 7,
      totalPracticeCount: 156,
      totalPracticeTime: 420,
      todayPracticeMinutes: 45,
      todayGoalProgress: { targetQuestions: 15, completedQuestions: 8, targetMinutes: 30, completedMinutes: 18, isCompleted: 0 },
      radarData: [
        { knowledgePointId: 1, knowledgePointName: '函数与导数', score: 0.85 },
        { knowledgePointId: 2, knowledgePointName: '三角函数', score: 0.65 },
        { knowledgePointId: 3, knowledgePointName: '数列', score: 0.92 },
        { knowledgePointId: 4, knowledgePointName: '立体几何', score: 0.35 },
        { knowledgePointId: 5, knowledgePointName: '解析几何', score: 0.45 },
        { knowledgePointId: 6, knowledgePointName: '概率统计', score: 0.78 },
      ],
      weakPoints: [
        { knowledgePointId: 4, knowledgePointName: '立体几何', score: 0.35 },
        { knowledgePointId: 5, knowledgePointName: '解析几何', score: 0.45 },
        { knowledgePointId: 2, knowledgePointName: '三角函数', score: 0.65 },
      ]
    };
  }
  try {
    const res = await request.get(`/parent/child-detail/${childId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch child detail failed", e);
    return null;
  }
}

export async function updateParentSettings(parentId: number, childId: number, settings: any) {
  if (USE_MOCK) {
    return { success: true, message: '设置已更新' };
  }
  const res = await request.post('/parent/settings', { parentId, childId, ...settings });
  return res.data;
}

export async function sendWeeklyReport(childId: number) {
  if (USE_MOCK) {
    return { success: true, message: '周报已发送到您的邮箱' };
  }
  const res = await request.post(`/parent/send-report/${childId}`);
  return res.data;
}
