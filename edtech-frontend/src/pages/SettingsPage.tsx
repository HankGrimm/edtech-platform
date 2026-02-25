import { useState, useEffect, useCallback } from 'react';
import {
    User, BookOpen, Bell, Users, Palette, Shield, Lock, CreditCard, CircleHelp,
    Save, CircleCheck, CircleAlert
} from 'lucide-react';
import { getSettings, updateSettings, type UserSettings } from '../api/services/settings';

// Sub-components (We will define them in the same file for simplicity if small, or separate)
// For this task, I will define them in separate files to be clean, but import them here.
// Since I haven't created them yet, I'll create the main page layout first.

import TabProfile from '../components/settings/TabProfile';
import TabLearning from '../components/settings/TabLearning';
import TabNotifications from '../components/settings/TabNotifications';
import TabParent from '../components/settings/TabParent';
import TabAppearance from '../components/settings/TabAppearance';
import TabAccount from '../components/settings/TabAccount';
import TabPrivacy from '../components/settings/TabPrivacy';
import TabSubscription from '../components/settings/TabSubscription';
import TabHelp from '../components/settings/TabHelp';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('learning');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    // Fetch initial settings
    useEffect(() => {
        getSettings().then(data => {
            setSettings(data);
        });
    }, []);

    // Debounced Save
    useEffect(() => {
        if (!settings) return;

        const timer = setTimeout(() => {
            setSaving(true);
            updateSettings(settings).then(() => {
                setSaving(false);
                setLastSaved(new Date());
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [settings]);

    const handleUpdate = useCallback((partial: Partial<UserSettings>) => {
        setSettings(prev => prev ? { ...prev, ...partial } : null);
    }, []);

    if (!settings) return <div className="p-10 text-center">Loading Settings...</div>;

    const tabs = [
        { id: 'profile', label: '个人资料', icon: User, component: TabProfile },
        { id: 'learning', label: '学习偏好', icon: BookOpen, component: TabLearning },
        { id: 'notifications', label: '通知提醒', icon: Bell, component: TabNotifications },
        { id: 'parent', label: '家长控制', icon: Users, component: TabParent },
        { id: 'appearance', label: '外观体验', icon: Palette, component: TabAppearance },
        { id: 'account', label: '账号安全', icon: Shield, component: TabAccount },
        { id: 'privacy', label: '隐私数据', icon: Lock, component: TabPrivacy },
        { id: 'subscription', label: '订阅支付', icon: CreditCard, component: TabSubscription },
        { id: 'help', label: '帮助反馈', icon: CircleHelp, component: TabHelp },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || TabLearning;

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">设置</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">管理您的个人偏好</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-100' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                            }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-4xl mx-auto p-8 pb-24">
                    {/* Header with Save Status */}
                    <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 py-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                            {saving ? (
                                <span className="text-indigo-600 flex items-center gap-1">
                                    <Save className="w-4 h-4 animate-pulse" /> 保存中...
                                </span>
                            ) : lastSaved ? (
                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition-opacity duration-1000">
                                    <CircleCheck className="w-4 h-4" /> 已保存
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[500px]">
                        <ActiveComponent settings={settings} onUpdate={handleUpdate} />
                    </div>
                </div>
            </main>
        </div>
    );
}

