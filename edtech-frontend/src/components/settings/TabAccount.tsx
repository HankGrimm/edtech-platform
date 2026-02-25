import { useState, useEffect } from 'react';
import { Lock, Smartphone, Mail, ShieldCheck, LogOut, Smartphone as DeviceIcon, X, Check, AlertCircle } from 'lucide-react';
import { getProfile, updatePhone, updateEmail, updatePassword } from '../../api/services/settings';
import type { TabProps } from './types';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function TabAccount({ settings, onUpdate }: TabProps) {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        getProfile().then(p => {
            setPhone(p.phone);
            setEmail(p.email);
        }).catch(() => {});
    }, []);

    const showFeedback = (type: 'success' | 'error', msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleSavePassword = async () => {
        if (newPassword.length < 6) {
            showFeedback('error', '新密码不能少于6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            showFeedback('error', '两次输入的密码不一致');
            return;
        }
        setSaving(true);
        try {
            await updatePassword(oldPassword, newPassword);
            setShowPasswordModal(false);
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            showFeedback('success', '密码修改成功，请重新登录');
        } catch (e: any) {
            showFeedback('error', e?.response?.data?.message || '修改失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePhone = async () => {
        if (!/^1[3-9]\d{9}$/.test(phoneInput)) {
            showFeedback('error', '请输入正确的11位手机号');
            return;
        }
        setSaving(true);
        try {
            await updatePhone(phoneInput);
            setPhone(phoneInput);
            setShowPhoneModal(false);
            setPhoneInput('');
            showFeedback('success', '手机号更新成功');
        } catch (e: any) {
            showFeedback('error', e?.response?.data?.message || '更新失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(emailInput)) {
            showFeedback('error', '请输入正确的邮箱地址');
            return;
        }
        setSaving(true);
        try {
            await updateEmail(emailInput);
            setEmail(emailInput);
            setShowEmailModal(false);
            setEmailInput('');
            showFeedback('success', '邮箱绑定成功');
        } catch (e: any) {
            showFeedback('error', e?.response?.data?.message || '绑定失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const maskPhone = (p: string) => p ? p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未绑定';
    const maskEmail = (e: string) => {
        if (!e) return '未绑定';
        const [user, domain] = e.split('@');
        return user.slice(0, 2) + '***@' + domain;
    };
    return (
        <div className="space-y-8">
            {/* Feedback Toast */}
            {feedback && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">登录与安全</h3>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                    <div
                        onClick={() => { setOldPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}
                        className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-slate-400" />
                            <div className="text-slate-700">修改密码</div>
                        </div>
                        <div className="text-sm text-slate-400">点击修改 &gt;</div>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="text-slate-700">绑定手机号</div>
                                <div className="text-sm text-slate-500">{maskPhone(phone)}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setPhoneInput(''); setShowPhoneModal(true); }}
                            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                        >
                            {phone ? '修改' : '绑定'}
                        </button>
                    </div>

                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="text-slate-700">绑定邮箱</div>
                                <div className="text-sm text-slate-500">{maskEmail(email)}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setEmailInput(''); setShowEmailModal(true); }}
                            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                        >
                            {email ? '修改' : '绑定'}
                        </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="text-slate-700">两步验证 (2FA)</div>
                                <div className="text-sm text-slate-500">登录新设备时需要验证码</div>
                            </div>
                        </div>
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">登录设备管理</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div className="flex items-center gap-3">
                            <DeviceIcon className="w-5 h-5 text-indigo-600" />
                            <div>
                                <div className="font-medium text-indigo-900">Chrome on Windows (当前设备)</div>
                                <div className="text-xs text-indigo-700">刚刚活跃 · 北京</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                            <DeviceIcon className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="font-medium text-slate-700">Safari on iPhone 14</div>
                                <div className="text-xs text-slate-500">3天前 · 上海</div>
                            </div>
                        </div>
                        <button className="text-xs text-red-500 hover:underline">移除</button>
                    </div>
                </div>
                <button className="w-full py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" /> 下线所有其他设备
                </button>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <Modal title="修改密码" onClose={() => setShowPasswordModal(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1.5">原密码</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="请输入原密码"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1.5">新密码</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="至少6位"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1.5">确认新密码</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="再次输入新密码"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                                取消
                            </button>
                            <button onClick={handleSavePassword} disabled={saving}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60">
                                {saving ? '保存中...' : '确认修改'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Phone Modal */}
            {showPhoneModal && (
                <Modal title={phone ? '修改手机号' : '绑定手机号'} onClose={() => setShowPhoneModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">请输入新的手机号码</p>
                        <input
                            type="tel"
                            value={phoneInput}
                            onChange={e => setPhoneInput(e.target.value)}
                            placeholder="请输入11位手机号"
                            maxLength={11}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800"
                        />
                        <div className="flex gap-3 pt-1">
                            <button onClick={() => setShowPhoneModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                                取消
                            </button>
                            <button onClick={handleSavePhone} disabled={saving}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60">
                                {saving ? '保存中...' : '确认保存'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <Modal title={email ? '修改邮箱' : '绑定邮箱'} onClose={() => setShowEmailModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">请输入要绑定的邮箱地址</p>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={e => setEmailInput(e.target.value)}
                            placeholder="example@email.com"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800"
                        />
                        <div className="flex gap-3 pt-1">
                            <button onClick={() => setShowEmailModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                                取消
                            </button>
                            <button onClick={handleSaveEmail} disabled={saving}
                                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60">
                                {saving ? '保存中...' : '确认绑定'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}


