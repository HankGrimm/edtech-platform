import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, LogIn, BookOpen, Target, Trophy, Brain, ArrowRight, Zap, Star, TrendingUp } from 'lucide-react';
import { useRef } from 'react';

const features = [
  {
    icon: Brain,
    title: 'AI 智能出题',
    desc: '基于知识追踪算法，精准定位薄弱点，动态生成个性化题目',
    color: 'from-violet-400/20 to-purple-400/20',
    border: 'hover:border-violet-400/40',
    iconColor: 'text-violet-400',
    iconBg: 'from-violet-400/20 to-purple-400/20',
  },
  {
    icon: Target,
    title: '自适应练习',
    desc: '根据掌握程度自动调节难度，让每一道题都恰到好处',
    color: 'from-sky-400/20 to-blue-400/20',
    border: 'hover:border-sky-400/40',
    iconColor: 'text-sky-400',
    iconBg: 'from-sky-400/20 to-blue-400/20',
  },
  {
    icon: Trophy,
    title: '成就系统',
    desc: '连续打卡、排行榜、成就徽章，让学习充满动力',
    color: 'from-amber-400/20 to-orange-400/20',
    border: 'hover:border-amber-400/40',
    iconColor: 'text-amber-400',
    iconBg: 'from-amber-400/20 to-orange-400/20',
  },
  {
    icon: BookOpen,
    title: '错题精析',
    desc: 'AI 深度解析每道错题，帮你彻底理解知识盲区',
    color: 'from-emerald-400/20 to-teal-400/20',
    border: 'hover:border-emerald-400/40',
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-400/20 to-teal-400/20',
  },
];

const stats = [
  { icon: Star, value: '98%', label: '用户满意度' },
  { icon: TrendingUp, value: '2.4x', label: '学习效率提升' },
  { icon: Zap, value: '10万+', label: '题库覆盖' },
];

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const floatVariants2 = {
  animate: {
    y: [0, 10, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 },
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white overflow-x-hidden">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[100px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Nav ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-20 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300">
            EdTech Platform
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-medium text-slate-300"
        >
          <LogIn className="w-4 h-4" />
          登录
        </motion.button>
      </motion.nav>

      {/* ── Hero ── */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-20 text-center"
      >
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-10"
        >
          <Zap className="w-3.5 h-3.5" />
          AI 驱动的个性化学习平台
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6"
        >
          <span className="text-white">智能学习，</span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400">
            精准提升
          </span>
        </motion.h1>

        {/* sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="text-lg text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          基于知识追踪算法，AI 实时分析你的学习状态，
          为你生成最适合的练习题，让每分钟的学习都有价值。
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 20px 40px rgba(139,92,246,0.35)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/app/practice')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-base shadow-xl shadow-violet-500/25 transition-shadow duration-300"
          >
            立即开始学习
            <ArrowRight className="w-4.5 h-4.5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/login')}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 text-slate-200 font-semibold text-base transition-all duration-200"
          >
            <LogIn className="w-4.5 h-4.5" />
            登录账号
          </motion.button>
        </motion.div>

        {/* floating decorative cards */}
        <div className="relative mt-20 h-48 hidden md:block pointer-events-none select-none">
          <motion.div
            variants={floatVariants}
            animate="animate"
            className="absolute left-[8%] top-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm text-sm text-slate-300 shadow-xl"
          >
            🎯 今日目标完成 <span className="text-emerald-400 font-semibold">87%</span>
          </motion.div>
          <motion.div
            variants={floatVariants2}
            animate="animate"
            className="absolute right-[8%] top-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm text-sm text-slate-300 shadow-xl"
          >
            🔥 连续打卡 <span className="text-amber-400 font-semibold">14 天</span>
          </motion.div>
          <motion.div
            variants={floatVariants}
            animate="animate"
            style={{ animationDelay: '2s' }}
            className="absolute left-[38%] bottom-0 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-sm text-sm text-slate-300 shadow-xl"
          >
            📈 本周正确率 <span className="text-sky-400 font-semibold">+12%</span>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid grid-cols-3 gap-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center py-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
            >
              <s.icon className="w-5 h-5 text-slate-500 mb-2" />
              <span className="text-2xl font-bold text-white">{s.value}</span>
              <span className="text-xs text-slate-500 mt-1">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-3">核心功能</h2>
          <p className="text-slate-500 text-base">一站式智能学习体验</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className={`group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] ${f.border} transition-all duration-300 cursor-default`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.iconBg} flex items-center justify-center mb-5`}>
                <f.icon className={`w-5 h-5 ${f.iconColor}`} />
              </div>
              <h3 className="font-semibold text-slate-100 mb-2 text-[15px]">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/15 p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">准备好了吗？</h2>
          <p className="text-slate-400 mb-8">加入数千名学生，开启你的智能学习之旅</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 20px 40px rgba(139,92,246,0.3)' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/login?mode=register')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-base shadow-lg shadow-violet-500/20 transition-shadow duration-300"
          >
            免费开始
            <ArrowRight className="w-4.5 h-4.5" />
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-slate-600 text-sm">
        © 2025 EdTech Platform. All rights reserved.
      </footer>
    </div>
  );
}
