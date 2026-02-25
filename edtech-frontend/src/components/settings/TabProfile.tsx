import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar } from '../../api/services/settings';
import type { TabProps } from './types';

export default function TabProfile({ settings, onUpdate }: TabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('只支持上传图片文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('图片大小不能超过 5MB');
            return;
        }

        setError('');
        setPreview(URL.createObjectURL(file));
        setUploading(true);
        try {
            const url = await uploadAvatar(file);
            onUpdate({ avatarUrl: url });
        } catch (e: any) {
            setError(e?.response?.data?.message || '上传失败，请重试');
            setPreview(null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const avatarSrc = preview || settings.avatarUrl;

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-slate-400 font-bold">
                                {settings.nickname?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <p className="text-sm text-slate-500">
                    {uploading ? '上传中...' : '点击相机图标更换头像（最大 5MB）'}
                </p>
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">昵称</label>
                    <input
                        type="text"
                        value={settings.nickname || ''}
                        onChange={(e) => onUpdate({ nickname: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="请输入昵称"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">真实姓名</label>
                    <input
                        type="text"
                        value={settings.realName || ''}
                        onChange={(e) => onUpdate({ realName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="请输入真实姓名"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">年级</label>
                    <select
                        value={settings.grade || ''}
                        onChange={(e) => onUpdate({ grade: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">请选择年级</option>
                        <option value="High1">高一</option>
                        <option value="High2">高二</option>
                        <option value="High3">高三</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">主攻学科</label>
                    <input
                        type="text"
                        value={settings.subject || ''}
                        onChange={(e) => onUpdate({ subject: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="例如：数学"
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">学习目标</label>
                    <textarea
                        value={settings.goal || ''}
                        onChange={(e) => onUpdate({ goal: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                        placeholder="写下你的短期或长期学习目标..."
                    />
                </div>
            </div>
        </div>
    );
}
