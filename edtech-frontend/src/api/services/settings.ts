import request, { ENABLE_MOCK } from '../request';

export interface UserSettings {
    userId: number;
    avatarUrl?: string;
    nickname?: string;
    realName?: string;
    grade?: string;
    subject?: string;
    goal?: string;

    dailyGoal: number;
    difficultyPreference: number;
    strategyWeights: string; // JSON
    correctionMode: boolean;
    durationReminder: boolean;
    durationReminderMinutes?: number;
    nightPause: boolean;
    nightPauseStart?: string;
    nightPauseEnd?: string;

    notifyDaily: boolean;
    notifyDailyTime?: string;
    notifyWeekly: boolean;
    notifyAchievement: boolean;
    notifyBrowser: boolean;
    notifyEmail: boolean;

    animationsEnabled: boolean;
    soundEnabled: boolean;

    privacyVisibility: 'private' | 'parent' | 'teacher';
    dataContribution: boolean;
}

const MOCK_SETTINGS: UserSettings = {
    userId: 1,
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    nickname: 'Student User',
    dailyGoal: 20,
    difficultyPreference: 0.5,
    strategyWeights: "{}",
    correctionMode: true,
    durationReminder: false,
    nightPause: true,
    notifyDaily: true,
    notifyWeekly: true,
    notifyAchievement: true,
    notifyBrowser: true,
    notifyEmail: false,
    fontSize: 'medium',
    animationsEnabled: true,
    soundEnabled: true,
    privacyVisibility: 'parent',
    dataContribution: true
};

export const getSettings = async (): Promise<UserSettings> => {
    if (ENABLE_MOCK) {
        return new Promise(resolve => setTimeout(() => resolve(MOCK_SETTINGS), 500));
    }
    const res = await request.get<UserSettings>('/settings');
    return res.data;
};

export const updateSettings = async (settings: UserSettings): Promise<UserSettings> => {
    if (ENABLE_MOCK) {
        console.log('[Mock] Update Settings:', settings);
        return new Promise(resolve => setTimeout(() => resolve(settings), 500));
    }
    const res = await request.put<UserSettings>('/settings', settings);
    return res.data;
};

export const bindParent = async (code: string): Promise<void> => {
    if (ENABLE_MOCK) {
        console.log('[Mock] Bind Parent:', code);
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    await request.post('/settings/bind-parent', { code });
};

export const uploadAvatar = async (file: File): Promise<string> => {
    if (ENABLE_MOCK) {
        return new Promise(resolve => setTimeout(() => resolve(URL.createObjectURL(file)), 500));
    }
    const formData = new FormData();
    formData.append('file', file);
    const res = await request.post<{ success: boolean; avatarUrl: string }>('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.avatarUrl;
};

export const updatePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (ENABLE_MOCK) {
        console.log('[Mock] Update Password');
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    await request.put('/auth/update-password', { oldPassword, newPassword });
};

export const getProfile = async (): Promise<{ phone: string; email: string }> => {
    if (ENABLE_MOCK) return { phone: '138****8888', email: '' };
    const res = await request.get<{ phone: string; email: string }>('/auth/profile');
    return res.data;
};

export const updatePhone = async (phone: string): Promise<void> => {
    if (ENABLE_MOCK) {
        console.log('[Mock] Update Phone:', phone);
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    await request.put('/auth/update-phone', { phone });
};

export const updateEmail = async (email: string): Promise<void> => {
    if (ENABLE_MOCK) {
        console.log('[Mock] Update Email:', email);
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    await request.put('/auth/update-email', { email });
};
