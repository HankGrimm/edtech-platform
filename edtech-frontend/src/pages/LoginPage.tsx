import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, Lock, Sparkles, BookOpen, Target, Trophy, ArrowRight, Mail, UserPlus } from 'lucide-react';
import request from '../api/request';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await request.post<{ token: string; role: string; username: string; userId: number }>(
        '/auth/login', { username, password }
      );
      const { token, role, username: uname, userId } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', uname);
      localStorage.setItem('userId', String(userId));
      navigate('/app');
    } catch (err: any) {
      setError(err?.response?.data?.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword.length < 6) { setError('密码不能少于6位'); return; }
    if (regPassword !== regConfirm) { setError('两次密码输入不一致'); return; }
    setLoading(true);
    try {
      const res = await request.post<{ token: string; role: string; username: string; userId: number }>(
        '/auth/register', { username: regUsername, password: regPassword, email: regEmail || undefined, role: 'STUDENT' }
      );
      const { token, role, username: uname, userId } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', uname);
      localStorage.setItem('userId', String(userId));
      navigate('/app');
    } catch (err: any) {
      setError(err?.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
  };
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EdTech AI</h1>
        </div>
        <div className="relative z-10 space-y-8">
          {[
            { icon: BookOpen, title: '智能练习', desc: 'BKT 算法驱动，精准推荐个性化题目' },
            { icon: Target,   title: '知识图谱', desc: '可视化学习进度，掌握情况一目了然' },
            { icon: Trophy,   title: '游戏化学习', desc: '成就徽章、排行榜，让学习充满乐趣' },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.2 }} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-indigo-100 mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm">© 2025 EdTech AI. 智能教育，开启未来。</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">EdTech AI</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
            {/* Tab Switch */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-8">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form key="login" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }} onSubmit={handleLogin} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">欢迎回来！</h2>
                    <p className="text-slate-500 mt-1">登录以继续你的学习之旅</p>
                  </div>
                  {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="输入用户名"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="输入密码"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="h-5 w-5" />登录</>}
                  </motion.button>
                  <p className="text-center text-sm text-slate-500">还没有账号？
                    <button type="button" onClick={() => switchMode('register')} className="text-indigo-600 font-medium hover:text-indigo-700 ml-1">立即注册</button>
                  </p>
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">创建账号</h2>
                    <p className="text-slate-500 mt-1">免费开始你的智能学习之旅</p>
                  </div>
                  {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">用户名 <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} required placeholder="设置用户名"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">邮箱 <span className="text-slate-400 font-normal">(选填)</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">密码 <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required placeholder="至少6位"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">确认密码 <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required placeholder="再次输入密码"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all" />
                    </div>
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="h-5 w-5" />立即注册</>}
                  </motion.button>
                  <p className="text-center text-sm text-slate-500">已有账号？
                    <button type="button" onClick={() => switchMode('login')} className="text-indigo-600 font-medium hover:text-indigo-700 ml-1">直接登录</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 text-center">
            <a href="#" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm">
              企业用户？使用 SSO 登录 <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

