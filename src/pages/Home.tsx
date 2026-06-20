import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  PencilRuler,
  Package,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle,
  Clock,
  Trash2,
  FolderOpen,
  Calculator,
  CalendarDays,
  FileCheck,
  X,
  AlertTriangle,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import { CLAIM_TYPES, getClaimTypeConfig } from '@/data/claimTypes';
import { useClaimStore } from '@/store/useClaimStore';
import type { ClaimType, ProjectRecord, ProjectExportBundle } from '@/types';

const iconMap = {
  Building2,
  PencilRuler,
  Package,
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export default function Home() {
  const navigate = useNavigate();
  const setClaimType = useClaimStore((s) => s.setClaimType);
  const reset = useClaimStore((s) => s.reset);
  const projectRecords = useClaimStore((s) => s.projectRecords);
  const loadProjectRecord = useClaimStore((s) => s.loadProjectRecord);
  const deleteProjectRecord = useClaimStore((s) => s.deleteProjectRecord);
  const clearActiveRecord = useClaimStore((s) => s.clearActiveRecord);

  const [confirmDel, setConfirmDel] = useState<ProjectRecord | null>(null);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportProjects = useClaimStore((s) => s.exportProjects);
  const importProjects = useClaimStore((s) => s.importProjects);

  const handleSelect = (type: ClaimType) => {
    reset();
    clearActiveRecord();
    setClaimType(type);
    navigate('/form');
  };

  const handleContinue = (rec: ProjectRecord) => {
    loadProjectRecord(rec.id);
    const type = rec.formData.claimType;
    if (type) {
      navigate('/form');
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDel) {
      deleteProjectRecord(confirmDel.id);
    }
    setConfirmDel(null);
  };

  const handleExport = () => {
    const bundle = exportProjects();
    if (bundle.records.length === 0) {
      setImportMsg({ type: 'error', text: '暂无项目可导出' });
      setTimeout(() => setImportMsg(null), 2500);
      return;
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.download = `停窝工索赔项目归档_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ProjectExportBundle;
      if (!data || !Array.isArray(data.records)) {
        throw new Error('文件格式不正确');
      }
      const { added, total } = importProjects(data);
      if (added > 0) {
        setImportMsg({ type: 'success', text: `导入成功，新增 ${added} 个项目（共 ${total} 个）` });
      } else {
        setImportMsg({ type: 'success', text: '未发现新项目（可能已存在相同记录）' });
      }
    } catch (err) {
      setImportMsg({ type: 'error', text: '导入失败，请检查文件格式' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportMsg(null), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDel(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <button onClick={() => setConfirmDel(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-warn-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warn-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">删除项目归档</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              确定要删除项目「<span className="font-medium text-slate-800">{confirmDel.name}</span>」的归档吗？
            </p>
            <p className="text-xs text-slate-500 mb-6">删除后无法恢复，已填写的所有信息、费用明细、证据和生成的函件都将丢失。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDel(null)} className="btn-secondary px-5 py-2.5">
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">停窝工索赔函件助手</h1>
              <p className="text-xs text-slate-500">AI 辅助 · 规范撰写 · 降低风险</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-primary-600" />
            <span>本工具仅供辅助参考，不替代专业法务审核</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 rounded-full text-primary-700 text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            三步生成专业索赔函件
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif tracking-tight">
            选择您的索赔类型
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            请根据实际发生的停窝工原因选择对应类型。系统将根据索赔类型匹配专业模板、
            必备证据清单和规范措辞，帮助您完整撰写索赔函件。
          </p>
        </div>

        <div className="mb-16">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                最近项目归档
              </h3>
              <div className="flex items-center gap-2">
                {projectRecords.length > 0 && (
                  <span className="text-xs text-slate-500 mr-2">
                    自动保存在浏览器本地，共 {projectRecords.length} 条
                  </span>
                )}
                {importMsg && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${importMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {importMsg.type === 'success' ? '✓' : '⚠'} {importMsg.text}
                  </span>
                )}
                {projectRecords.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="btn-ghost !py-1.5 !px-3 text-sm flex items-center gap-1.5"
                    title="导出为 JSON 文件"
                  >
                    <Download className="w-4 h-4" />
                    导出
                  </button>
                )}
                <button
                  onClick={handleImportClick}
                  className="btn-secondary !py-1.5 !px-3 text-sm flex items-center gap-1.5"
                  title="从 JSON 文件导入"
                >
                  <Upload className="w-4 h-4" />
                  导入归档
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {projectRecords.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-7 h-7 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-2">暂无本地项目</h4>
                <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                  项目数据保存在浏览器本地。如果您之前导出过归档文件，点击下方按钮导入即可继续编辑；也可以从下方选择索赔类型开始新建。
                </p>
                <button
                  onClick={handleImportClick}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  导入归档文件
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectRecords.map((rec) => {
                  const cfg = getClaimTypeConfig(rec.claimType);
                  const Icon = cfg ? (iconMap[cfg.icon as keyof typeof iconMap] || FileText) : FileText;
                  return (
                    <div
                      key={rec.id}
                      className="card card-hover flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-primary-700" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 truncate" title={rec.name}>
                              {rec.name}
                            </h4>
                            <p className="text-xs text-primary-700 font-medium mt-0.5">{cfg?.title || '—'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmDel(rec)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0"
                          title="删除该项目归档"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 mb-4 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calculator className="w-3 h-3" /> 索赔金额
                          </span>
                          <span className="font-semibold text-slate-800">
                            {rec.totalCost != null
                              ? `¥ ${rec.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <CalendarDays className="w-3 h-3" /> 停窝工天数
                          </span>
                          <span className="font-semibold text-slate-800">
                            {rec.confirmedDays != null ? `${rec.confirmedDays} 天` : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <FileCheck className="w-3 h-3" /> 已收集证据
                          </span>
                          <span className="font-semibold text-slate-800">{rec.evidenceCount} 项</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                          <span className="text-slate-500">最近更新</span>
                          <span className="font-medium text-slate-600">{formatDateTime(rec.updatedAt) || '—'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleContinue(rec)}
                        className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-primary-600 text-primary-700 font-medium text-sm hover:bg-primary-700 hover:text-white transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                        继续编辑
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {CLAIM_TYPES.map((type, index) => {
            const Icon = iconMap[type.icon as keyof typeof iconMap] || FileText;
            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                className="group card card-hover text-left flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-5 group-hover:bg-primary-700 transition-colors duration-300">
                  <Icon className="w-7 h-7 text-primary-700 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                  {type.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                  {type.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {type.requiredEvidences.length} 项必备证据
                  </span>
                  <span className="flex items-center gap-1 text-primary-700 font-medium text-sm group-hover:gap-2 transition-all duration-200">
                    开始填写
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: '结构化录入信息',
              desc: '填写合同条款、事件经过、停窝工天数、费用明细，勾选现有证据并填写台账信息，避免关键事实遗漏。',
            },
            {
              step: '02',
              title: '智能生成函件',
              desc: '系统依据索赔类型自动匹配规范模板，生成索赔意向通知、费用索赔报告或催办函，并附带证据目录。',
            },
            {
              step: '03',
              title: '标注缺失 + 调整措辞',
              desc: '按事实/合同/证据分组标注缺失项，可跳转填写页对应区域补充，还可调整措辞从商务协商到合同维权。',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="text-4xl font-serif font-bold text-primary-100 leading-none select-none">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>⚠ 本工具为辅助写作工具，生成内容须经法务或专业人员审核后方可发出</p>
          <p className="mt-2 text-xs text-slate-400">项目数据存储在您本地浏览器，不会上传到任何服务器</p>
        </div>
      </footer>
    </div>
  );
}
