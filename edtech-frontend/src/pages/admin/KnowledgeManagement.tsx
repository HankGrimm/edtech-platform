import { useState, useEffect } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';

interface KnowledgePoint {
  id: number;
  name: string;
  subject: string;
  description: string;
  parentId: number | null;
  pInit: number;
  pTransit: number;
  pGuess: number;
  pSlip: number;
  prerequisites: number[];
}

export default function KnowledgeManagement() {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPrereqModal, setShowPrereqModal] = useState(false);
  const [editingKP, setEditingKP] = useState<KnowledgePoint | null>(null);
  const [formData, setFormData] = useState({ name: '', subject: '数学', description: '', pInit: 0.3, pTransit: 0.1, pGuess: 0.2, pSlip: 0.1 });

  useEffect(() => { fetchKnowledgePoints(); }, []);

  const fetchKnowledgePoints = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/knowledge-points', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setKnowledgePoints(data.data);
          return;
        }
      }
      throw new Error('Failed to load knowledge points');
    } catch (error) {
      console.error('Failed to fetch knowledge points, using mock data:', error);
      setKnowledgePoints([
        { id: 1, name: '一次函数', subject: '数学', description: '一次函数的定义、图像和性质', parentId: null, pInit: 0.3, pTransit: 0.1, pGuess: 0.2, pSlip: 0.1, prerequisites: [] },
        { id: 2, name: '二次函数', subject: '数学', description: '二次函数的定义、图像和性质', parentId: null, pInit: 0.25, pTransit: 0.12, pGuess: 0.18, pSlip: 0.08, prerequisites: [1] },
        { id: 3, name: '指数函数', subject: '数学', description: '指数函数的定义和性质', parentId: null, pInit: 0.2, pTransit: 0.15, pGuess: 0.15, pSlip: 0.1, prerequisites: [1, 2] },
        { id: 4, name: '对数函数', subject: '数学', description: '对数函数的定义和性质', parentId: null, pInit: 0.2, pTransit: 0.15, pGuess: 0.15, pSlip: 0.1, prerequisites: [3] },
        { id: 5, name: '三角函数', subject: '数学', description: '正弦、余弦、正切函数', parentId: null, pInit: 0.25, pTransit: 0.1, pGuess: 0.2, pSlip: 0.12, prerequisites: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingKP(null);
    setFormData({ name: '', subject: '数学', description: '', pInit: 0.3, pTransit: 0.1, pGuess: 0.2, pSlip: 0.1 });
    setShowModal(true);
  };

  const openEditModal = (kp: KnowledgePoint) => {
    setEditingKP(kp);
    setFormData({ name: kp.name, subject: kp.subject, description: kp.description, pInit: kp.pInit, pTransit: kp.pTransit, pGuess: kp.pGuess, pSlip: kp.pSlip });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: Partial<KnowledgePoint> = {
        ...(editingKP ? { id: editingKP.id } : {}),
        name: formData.name,
        subject: formData.subject,
        description: formData.description,
        pInit: formData.pInit,
        pTransit: formData.pTransit,
        pGuess: formData.pGuess,
        pSlip: formData.pSlip,
        parentId: editingKP ? editingKP.parentId : null,
        prerequisites: editingKP ? editingKP.prerequisites : [],
      };

      const response = await fetch('/api/admin/knowledge-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        alert(data.message || '保存失败');
        return;
      }
      await fetchKnowledgePoints();
      setShowModal(false);
      setEditingKP(null);
    } catch (error) {
      console.error('保存知识点失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个知识点吗？')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/knowledge-points/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        alert(data.message || '删除失败');
        return;
      }
      await fetchKnowledgePoints();
    } catch (error) {
      console.error('删除知识点失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const openPrereqModal = (kp: KnowledgePoint) => {
    setEditingKP(kp);
    setShowPrereqModal(true);
  };

  const togglePrereq = (prereqId: number) => {
    if (!editingKP) return;
    const newPrereqs = editingKP.prerequisites.includes(prereqId)
      ? editingKP.prerequisites.filter(id => id !== prereqId)
      : [...editingKP.prerequisites, prereqId];
    
    setKnowledgePoints(kps => kps.map(kp => kp.id === editingKP.id ? { ...kp, prerequisites: newPrereqs } : kp));
    setEditingKP({ ...editingKP, prerequisites: newPrereqs });
  };

  const handleSavePrereq = async () => {
    if (!editingKP) {
      setShowPrereqModal(false);
      return;
    }
    try {
      const payload: Partial<KnowledgePoint> = {
        id: editingKP.id,
        name: editingKP.name,
        subject: editingKP.subject,
        description: editingKP.description,
        pInit: editingKP.pInit,
        pTransit: editingKP.pTransit,
        pGuess: editingKP.pGuess,
        pSlip: editingKP.pSlip,
        parentId: editingKP.parentId,
        prerequisites: editingKP.prerequisites,
      };

      const response = await fetch('/api/admin/knowledge-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        alert(data.message || '保存前驱关系失败');
        return;
      }
      await fetchKnowledgePoints();
      setShowPrereqModal(false);
    } catch (error) {
      console.error('保存前驱关系失败:', error);
      alert('保存前驱关系失败，请稍后重试');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">知识点管理</h1>
        <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusOutlined className="mr-2" />新增知识点
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">知识点名称</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">学科</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">BKT参数</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">前驱知识点</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">加载中...</td></tr>
            ) : knowledgePoints.map(kp => (
              <tr key={kp.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{kp.name}</p>
                  <p className="text-slate-400 text-sm">{kp.description}</p>
                </td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{kp.subject}</span></td>
                <td className="px-6 py-4 text-slate-300 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <span>P(L₀): {kp.pInit}</span>
                    <span>P(T): {kp.pTransit}</span>
                    <span>P(G): {kp.pGuess}</span>
                    <span>P(S): {kp.pSlip}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {kp.prerequisites.length === 0 ? (
                      <span className="text-slate-500 text-sm">无</span>
                    ) : kp.prerequisites.map(prereqId => {
                      const prereq = knowledgePoints.find(k => k.id === prereqId);
                      return prereq ? (
                        <span key={prereqId} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">{prereq.name}</span>
                      ) : null;
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(kp)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="编辑"><EditOutlined /></button>
                    <button onClick={() => openPrereqModal(kp)} className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors" title="编辑前驱"><LinkOutlined /></button>
                    <button onClick={() => handleDelete(kp.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="删除"><DeleteOutlined /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">{editingKP ? '编辑知识点' : '新增知识点'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">名称</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">学科</label>
                <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="数学">数学</option>
                  <option value="物理">物理</option>
                  <option value="化学">化学</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2">描述</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">P(L₀) 初始掌握</label>
                  <input type="number" step="0.01" min="0" max="1" value={formData.pInit} onChange={e => setFormData({ ...formData, pInit: parseFloat(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">P(T) 学习转移</label>
                  <input type="number" step="0.01" min="0" max="1" value={formData.pTransit} onChange={e => setFormData({ ...formData, pTransit: parseFloat(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">P(G) 猜对概率</label>
                  <input type="number" step="0.01" min="0" max="1" value={formData.pGuess} onChange={e => setFormData({ ...formData, pGuess: parseFloat(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">P(S) 失误概率</label>
                  <input type="number" step="0.01" min="0" max="1" value={formData.pSlip} onChange={e => setFormData({ ...formData, pSlip: parseFloat(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">取消</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Prerequisites Modal */}
      {showPrereqModal && editingKP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">编辑前驱知识点 - {editingKP.name}</h2>
            </div>
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {knowledgePoints.filter(kp => kp.id !== editingKP.id).map(kp => (
                <label key={kp.id} className="flex items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input type="checkbox" checked={editingKP.prerequisites.includes(kp.id)} onChange={() => togglePrereq(kp.id)} className="w-5 h-5 rounded border-slate-500 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-3 text-white">{kp.name}</span>
                </label>
              ))}
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end">
              <button onClick={handleSavePrereq} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">完成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
