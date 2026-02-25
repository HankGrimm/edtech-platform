import type { TabProps } from './types';
import { Type, Zap, Volume2 } from 'lucide-react';

export default function TabAppearance({ settings, onUpdate }: TabProps) {
    return (
        <div className="space-y-8">
            {/* Font Size */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Type className="w-5 h-5" /> 字体大小
                </h3>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {['small', 'medium', 'large'].map((size) => (
                        <button
                            key={size}
                            onClick={() => onUpdate({ fontSize: size as any })}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                settings.fontSize === size 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {size === 'small' ? '小 - A' : size === 'medium' ? '中 - A' : '大 - A'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Effects */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">交互体验</h3>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="font-medium text-slate-800">界面动画效果</div>
                                <div className="text-sm text-slate-500">开启后界面切换更流畅，老旧设备建议关闭</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => onUpdate({ animationsEnabled: !settings.animationsEnabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.animationsEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Volume2 className="w-5 h-5 text-slate-400" />
                            <div>
                                <div className="font-medium text-slate-800">答题音效</div>
                                <div className="text-sm text-slate-500">答对/答错时的提示音效</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
