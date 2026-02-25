import request, { ENABLE_MOCK as REQUEST_ENABLE_MOCK } from '../request';
import type { KnowledgeStateVO } from '../../components/dashboard/KnowledgeRadarChart';
import type { QuestionData } from '../../components/chat/QuestionCard';

// --- Configuration ---
// Set to false to use real backend data (MySQL/Redis)
// Set to true to use static mock data (for UI testing without backend)
// Override request mock setting if needed, or use a local constant
const USE_MOCK = REQUEST_ENABLE_MOCK; 

// --- Types ---
export interface SubmitAnswerRequest {
  studentId: number;
  questionId: number;
  isCorrect: boolean;
  duration?: number;
}

export interface KnowledgePoint {
  id: number;
  name: string;
  subject: string;
  description: string;
}

export interface StudentExerciseLog {
  id: number;
  questionId: number;
  result: number;
  duration: number;
  submitTime: string;
}

export interface PredictionResult {
    studentId: number;
    predictedScore: number;
    confidence: number;
}

export interface MasteryTrendPoint {
  date: string;
  accuracy: number;
  total: number;
}

// --- Mock Data (Fallback) ---
const MOCK_RADAR_DATA: KnowledgeStateVO[] = [
  { knowledgePointId: 1, knowledgePointName: '函数与导数', score: 0.85, level: 'Master' },
  { knowledgePointId: 2, knowledgePointName: '三角函数', score: 0.65, level: 'Proficient' },
  { knowledgePointId: 3, knowledgePointName: '数列', score: 0.92, level: 'Master' },
  { knowledgePointId: 4, knowledgePointName: '立体几何', score: 0.35, level: 'Novice' },
  { knowledgePointId: 5, knowledgePointName: '解析几何', score: 0.45, level: 'Novice' },
  { knowledgePointId: 6, knowledgePointName: '概率统计', score: 0.78, level: 'Proficient' },
];

const MOCK_GRAPH_DATA: Record<string, KnowledgePoint[]> = {
  "Math": [
    { id: 1, name: "函数与导数", subject: "Math", description: "Function concepts" },
    { id: 2, name: "三角函数", subject: "Math", description: "Trigonometry" }
  ],
  "Physics": [
    { id: 10, name: "力学", subject: "Physics", description: "Mechanics" }
  ]
};

const MOCK_AI_QUESTION: QuestionData = {
  id: 202,
  stem: "若 $\\sin \\alpha = \\frac{1}{3}$，且 $\\alpha \\in (\\frac{\\pi}{2}, \\pi)$，则 $\\cos \\alpha =$ ？",
  options: [
    "A. $\\frac{2\\sqrt{2}}{3}$",
    "B. $-\\frac{2\\sqrt{2}}{3}$",
    "C. $\\frac{1}{3}$",
    "D. $-\\frac{1}{3}$"
  ],
  correctAnswer: "B",
  analysis: "解析：\n1. 由 $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$，得 $|\\cos \\alpha| = \\sqrt{1 - (\\frac{1}{3})^2} = \\frac{2\\sqrt{2}}{3}$。\n2. 因为 $\\alpha \\in (\\frac{\\pi}{2}, \\pi)$，即第二象限角，余弦值为负。\n3. 所以 $\\cos \\alpha = -\\frac{2\\sqrt{2}}{3}$。\n\n选 B。"
};

// --- Services ---

/**
 * 获取知识图谱数据
 */
export async function getKnowledgeGraph(): Promise<Record<string, KnowledgePoint[]>> {
  if (USE_MOCK) return MOCK_GRAPH_DATA;
  try {
    const res = await request.get<Record<string, KnowledgePoint[]>>('/knowledge/graph');
    return res.data;
  } catch (e) {
    console.error("Fetch graph failed", e);
    return MOCK_GRAPH_DATA;
  }
}

export interface QuestionResponse {
    data: QuestionData;
    strategy: string;
    strategyCode: string;
}

/**
 * 获取随机题目 (Smart Practice)
 */
export async function getRandomQuestion(): Promise<QuestionResponse> {
  if (USE_MOCK) return { data: MOCK_AI_QUESTION, strategy: 'Mock Strategy', strategyCode: 'MOCK' };
  try {
    const res = await request.get<any>('/practice/random');
    
    // Check if response is wrapped in new Strategy format or legacy
    let qData = res.data;
    let strategy = "智能推荐";
    let strategyCode = "DEFAULT";

    if (res.data.data && res.data.strategy) {
        qData = res.data.data;
        strategy = res.data.strategy;
        strategyCode = res.data.strategyCode;
    }

    // Adapt backend response to frontend model
    let opts = qData.options;
    if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch(e) {}
    }
    
    // Normalize options to string array if it's a map (e.g. {"A": "val"})
    if (opts && !Array.isArray(opts) && typeof opts === 'object') {
        opts = Object.keys(opts).sort().map(key => opts[key]);
    }

    const question: QuestionData = {
        id: qData.id || Date.now(),
        stem: qData.stem || qData.content || "题目内容缺失",
        options: opts,
        correctAnswer: qData.correctAnswer,
        analysis: qData.analysis || "暂无解析"
    };

    return { data: question, strategy, strategyCode };
  } catch (e) {
    console.error("Fetch question failed", e);
    return { data: MOCK_AI_QUESTION, strategy: 'Error Fallback', strategyCode: 'ERROR' };
  }
}

/**
 * 获取学习报告
 */
export async function getStudentReport(studentId: number): Promise<StudentExerciseLog[]> {
  if (USE_MOCK) return [];
  try {
    const res = await request.get<StudentExerciseLog[]>(`/report/student/${studentId}`);
    return res.data;
  } catch (e) {
    console.error("Fetch report failed", e);
    return [];
  }
}

export async function getMasteryTrend(studentId: number, days = 30): Promise<MasteryTrendPoint[]> {
  if (USE_MOCK) {
    const result: MasteryTrendPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const total = 5 + Math.floor(Math.random() * 10);
      const accuracy = 0.4 + Math.random() * 0.5;
      result.push({
        date: d.toISOString().slice(0, 10),
        accuracy,
        total,
      });
    }
    return result;
  }
  try {
    const res = await request.get<MasteryTrendPoint[]>(`/report/trend/${studentId}`, { params: { days } });
    return res.data;
  } catch (e) {
    console.error("Fetch mastery trend failed", e);
    return [];
  }
}

/**
 * 提交答题结果
 */
export async function submitExerciseResult(data: SubmitAnswerRequest): Promise<void> {
  if (USE_MOCK) {
    console.log('[Mock] Submit Result:', data);
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }
  await request.post('/practice/submit', data);
}

/**
 * 获取 AI 智能解析
 */
export async function getAiExplanation(questionContent: string, wrongAnswer: string, correctAnswer: string): Promise<string> {
    if (USE_MOCK) return "Mock Explanation: This is a simulated AI response.";
    try {
        const res = await request.post<any>('/ai/explain', {
            questionContent, wrongAnswer, correctAnswer
        });
        return res.data.explanation;
    } catch (e) {
        console.error("AI Explain failed", e);
        return "Failed to get AI explanation.";
    }
}

/**
 * 获取成绩预测
 */
export async function getPrediction(studentId: number): Promise<PredictionResult> {
    if (USE_MOCK) return { studentId, predictedScore: 85, confidence: 0.8 };
    try {
        const res = await request.get<PredictionResult>(`/dashboard/prediction/${studentId}`);
        return res.data;
    } catch (e) {
        console.error("Prediction failed", e);
        return { studentId, predictedScore: 0, confidence: 0 };
    }
}

/**
 * 获取雷达图数据
 */
export async function getKnowledgeRadar(studentId: number): Promise<KnowledgeStateVO[]> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_RADAR_DATA;
  }
  try {
    const res = await request.get<KnowledgeStateVO[]>(`/dashboard/radar/${studentId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to fetch radar data, falling back to mock", error);
    return MOCK_RADAR_DATA; // Fallback to mock on error
  }
}

/**
 * AI 生成题目 (Manual Generation) - 新版本支持真实AI
 */
export interface GenerateQuestionParams {
    subject: string;
    knowledgePointId?: number;
    difficulty?: string;
    domain?: string;
    source?: string;
}

export async function generatePracticeQuestion(params: GenerateQuestionParams): Promise<QuestionResponse> {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟AI思考时间
        const difficulties = ['Easy', 'Medium', 'Hard'];
        const mockQuestions = {
            'Easy': {
                ...MOCK_AI_QUESTION,
                id: Date.now(),
                stem: "计算 $2 + 3 \\times 4$ 的值是？",
                options: ["A. 20", "B. 14", "C. 10", "D. 24"],
                correctAnswer: "B",
                analysis: "根据运算顺序，先算乘法：$3 \\times 4 = 12$，再算加法：$2 + 12 = 14$。"
            },
            'Hard': {
                ...MOCK_AI_QUESTION,
                id: Date.now(),
                stem: "已知函数 $f(x) = \\ln(x+1) - ax$ 在 $(0, +\\infty)$ 上单调递减，则实数 $a$ 的取值范围是？",
                options: ["A. $a \\geq 1$", "B. $a > 1$", "C. $a \\leq 1$", "D. $a < 1$"],
                correctAnswer: "A",
                analysis: "对 $f(x)$ 求导：$f'(x) = \\frac{1}{x+1} - a$。要使函数在 $(0, +\\infty)$ 上单调递减，需 $f'(x) \\leq 0$ 恒成立..."
            }
        };
        
        const selectedQuestion = mockQuestions[params.difficulty as keyof typeof mockQuestions] || mockQuestions['Easy'];
        return { 
            data: selectedQuestion, 
            strategy: `🤖 AI智能出题 (${params.difficulty})`, 
            strategyCode: 'AI_GENERATED' 
        };
    }
    
    try {
        console.log('🎯 发起AI出题请求:', params);
        
        // 调用新的AI专用接口
        const res = await request.post<any>('/ai/generate-question', {
            studentId: 1,
            subject: params.subject,
            knowledgePointId: params.knowledgePointId,
            difficulty: params.difficulty || 'Medium',
            domain: params.domain,
            source: params.source || 'opensat'
        });
        
        // 检查是否是错误响应
        if (res.data.error) {
            throw new Error(res.data.message || 'AI生成失败');
        }
        
        // 解析AI生成的题目数据
        let qData = res.data.data || res.data;
        
        // 标准化选项格式
        let opts = qData.options;
        if (typeof opts === 'string') {
            try { opts = JSON.parse(opts); } catch(e) { console.warn('选项解析失败:', e); }
        }
        if (opts && !Array.isArray(opts) && typeof opts === 'object') {
            opts = Object.keys(opts).sort().map(key => opts[key]);
        }

        const question: QuestionData = {
            id: qData.id,
            stem: qData.content,
            options: opts || [],
            correctAnswer: qData.correctAnswer,
            analysis: qData.analysis || "AI解析生成中..."
        };

        const response: QuestionResponse = {
            data: question, 
            strategy: res.data.strategy || `🤖 AI智能出题 (${params.difficulty})`, 
            strategyCode: res.data.strategyCode || 'AI_GENERATED'
        };
        
        console.log('✅ AI题目生成成功:', response);
        return response;
        
    } catch (error) {
        console.error("❌ AI出题失败:", error);
        
        // 优雅降级 - 返回友好的错误提示
        const errorQuestion: QuestionData = {
            id: Date.now(),
            stem: "🤖 AI正在思考中，请稍后重试...",
            options: ["A. 重新生成", "B. 切换到随机模式", "C. 调整难度设置", "D. 稍后再试"],
            correctAnswer: "A",
            analysis: "AI服务暂时繁忙，建议：\n1. 检查网络连接\n2. 重新生成题目\n3. 或切换到随机练习模式"
        };
        
        return { 
            data: errorQuestion, 
            strategy: '⚠️ AI服务异常', 
            strategyCode: 'ERROR' 
        };
    }
}

export interface ExamQuestionRecord {
  stem: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  domain?: string;
}

export interface WrongQuestionAnalysis {
  question_index: number;
  user_answer: string;
  correct: string;
  why_wrong: string;
  key_concept: string;
}

export interface ExamReport {
  total_score: number;
  rw_score: number;
  math_score: number;
  percentile_estimate: string;
  strengths: string[];
  weaknesses: string[];
  wrong_questions_analysis: WrongQuestionAnalysis[];
  study_plan: string;
}

export async function generateExamReport(questions: ExamQuestionRecord[], subject: string): Promise<ExamReport> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 2000));
    return {
      total_score: 1280,
      rw_score: 650,
      math_score: 630,
      percentile_estimate: '约 85 分位',
      strengths: ['Information and Ideas', 'Standard English Conventions'],
      weaknesses: ['Craft and Structure: 修辞手法分析', 'Expression of Ideas: 段落逻辑'],
      wrong_questions_analysis: [
        { question_index: 2, user_answer: 'B', correct: 'C', why_wrong: '混淆了作者意图与文章主旨', key_concept: 'Central Idea' },
      ],
      study_plan: '建议每天练习 15 道 Craft and Structure 题目，重点复习修辞分析技巧。',
    };
  }
  const res = await request.post<any>('/ai/exam-report', {
    subject,
    questions,
  });
  if (!res.data.success) throw new Error(res.data.message || 'Report generation failed');
  return res.data.report as ExamReport;
}

/**
 * AI 生成题目 (Legacy/Topic based)
 * @param topic 想要复习的知识点 (Prompt)
 */
export async function generateQuestion(topic: string): Promise<QuestionData> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { ...MOCK_AI_QUESTION, id: Date.now() };
  }
  try {
    const res = await request.post<QuestionData>('/ai/generate', { topic });
    return res.data;
  } catch (error) {
     console.error("Failed to generate question, falling back to mock", error);
     return { ...MOCK_AI_QUESTION, id: Date.now() };
  }
}
