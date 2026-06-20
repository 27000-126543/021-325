import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Info,
  ClipboardList,
  FileCheck,
  Scale,
  ArrowRight,
  CalendarDays,
  User,
  Hash,
  MessageSquare,
  Save,
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { LETTER_TYPES, getClaimTypeConfig } from '@/data/claimTypes';
import type { LetterType, MissingGroup } from '@/types';

const groupIcons = {
  fact: ClipboardList,
  contract: Scale,
  evidence: FileCheck,
};

const groupColors = {
  fact: { bg: 'bg-warn-50', border: 'border-warn-200', headerBg: 'bg-warn-50', headerBorder: 'border-warn-200', icon: 'text-warn-600', title: 'text-warn-800', text: 'text-warn-800', badge: 'bg-warn-100 text-warn-700' },
  contract: { bg: 'bg-blue-50', border: 'border-blue-200', headerBg: 'bg-blue-50', headerBorder: 'border-blue-200', icon: 'text-blue-600', title: 'text-blue-800', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  evidence: { bg: 'bg-red-50', border: 'border-red-200', headerBg: 'bg-red-50', headerBorder: 'border-red-200', icon: 'text-red-600', title: 'text-red-800', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
};

function fmtDate(s: string): string {
  return s || '—';
}

export default function PreviewPage() {
  const navigate = useNavigate();
  const formData = useClaimStore((s) => s.formData);
  const result = useClaimStore((s) => s.result);
  const activeRecordId = useClaimStore((s) => s.activeRecordId);
  const generateLetter = useClaimStore((s) => s.generateLetter);
  const saveProjectToRecords = useClaimStore((s) => s.saveProjectToRecords);
  const [copied, setCopied] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!formData.claimType) {
      navigate('/');
      return;
    }
    if (!result) {
      generateLetter('intent_notice');
    }
  }, [formData.claimType, result, generateLetter, navigate]);

  const handleSwitchLetter = (type: LetterType) => {
    generateLetter(type);
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${LETTER_TYPES.find((t) => t.id === result.letterType)?.title || '索赔函件'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMissingClick = (targetSection: string) => {
    navigate(`/form?scrollTo=${targetSection}`);
  };

  const handleSave = () => {
    const id = saveProjectToRecords();
    if (id) {
      setSaveMsg(activeRecordId ? '✓ 已更新项目归档' : '✓ 已保存归档');
    } else {
      setSaveMsg('⚠ 请先填写项目名称');
    }
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const totalMissing = result?.missingGroups.reduce((sum, g) => sum + g.items.length, 0) ?? 0;

  const renderMissingGroups = (groups: MissingGroup[]) => {
    if (groups.length === 0) return null;
    return (
      <div className="space-y-4">
        {groups.map((group) => {
          const Icon = groupIcons[group.group];
          const colors = groupColors[group.group];
          return (
            <div key={group.group} className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
              <div className={`${colors.headerBg} px-5 py-3 border-b ${colors.headerBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                  <h4 className={`font-semibold ${colors.title}`}>{group.groupTitle}</h4>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
                  {group.items.length} 项
                </span>
              </div>
              <div className="p-4 space-y-2">
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMissingClick(item.targetSection)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all text-left group/item"
                  >
                    <span className={`w-5 h-5 rounded-full ${colors.badge} text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      {idx + 1}
                    </span>
                    <span className={`text-sm ${colors.text} font-medium leading-relaxed flex-1`}>
                      {item.text}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover/item:text-primary-600 flex-shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!result) return null;

  const costItems = formData.costItems.filter(
    (it) => it.name.trim() && it.amount != null && !isNaN(it.amount) && it.amount > 0
  );
  const hasCostBreakdown = costItems.length > 0;
  const totalCost = costItems.reduce((acc, it) => acc + (it.amount || 0), 0);

  const claimConfig = formData.claimType ? getClaimTypeConfig(formData.claimType) : null;

  const evidences = formData.evidences.filter((e) => e.name.trim());
  const hasEvidences = evidences.length > 0 || formData.customEvidence.trim();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/form')} className="btn-ghost flex items-center gap-2 -ml-4">
            <ArrowLeft className="w-4 h-4" />
            返回修改信息
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">1</span>
              填写信息
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">2</span>
              预览函件
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-medium">3</span>
              调整措辞
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex gap-1 shadow-sm">
                {LETTER_TYPES.map((type) => {
                  const isActive = result.letterType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleSwitchLetter(type.id)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                      }`}
                    >
                      {type.title}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                {saveMsg && (
                  <span className={`text-sm font-medium ${saveMsg.startsWith('✓') ? 'text-green-600' : 'text-warn-600'}`}>{saveMsg}</span>
                )}
                <button onClick={handleSave} className="btn-secondary !py-2 !px-3 text-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                {activeRecordId ? '更新归档' : '保存归档'}
              </button>
              </div>
            </div>

            <div className="bg-warn-50 border border-warn-200 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-warn-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-warn-800">
                <p className="font-medium mb-1">
                  {LETTER_TYPES.find((t) => t.id === result.letterType)?.title}使用提示
                </p>
                <p className="text-warn-700">
                  {LETTER_TYPES.find((t) => t.id === result.letterType)?.description}
                </p>
              </div>
            </div>

            <div className="letter-paper">
              <pre className="whitespace-pre-wrap font-serif text-base leading-loose text-slate-800">
                {result.content}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button onClick={handleCopy} className="btn-secondary flex items-center justify-center gap-2">
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制到剪贴板' : '复制全部内容'}
              </button>
              <button onClick={handleDownload} className="btn-secondary flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                导出文本文件
              </button>
              <button onClick={() => navigate('/edit')} className="btn-primary flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" />
                调整措辞风格
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            {totalMissing > 0 ? (
              <div className="space-y-0">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <AlertTriangle className="w-5 h-5 text-warn-600" />
                  <h3 className="font-semibold text-warn-800">缺失依据提醒</h3>
                  <span className="text-xs bg-warn-100 text-warn-700 px-2 py-0.5 rounded-full font-medium">
                    共 {totalMissing} 项
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4 px-1">
                  点击缺失项可跳转到填写页对应区域补充，补完返回预览时状态自动更新。
                </p>
                {renderMissingGroups(result.missingGroups)}
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-green-400 shadow-sm">
                <div className="bg-green-50 px-5 py-3.5 border-b border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">事实依据已完备</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-green-700">
                    已填写的信息和证据材料较为完整，建议交由法务或专业人员最终审核后发出。
                  </p>
                </div>
              </div>
            )}

            {hasEvidences && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-primary-600" />
                  证据目录台账
                </h3>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 px-2 font-medium">序号</th>
                      <th className="text-left py-2 px-2 font-medium">证据名称</th>
                      <th className="text-left py-2 px-2 font-medium whitespace-nowrap"><CalendarDays className="w-3 h-3 inline mr-1" />取得</th>
                      <th className="text-left py-2 px-2 font-medium whitespace-nowrap"><User className="w-3 h-3 inline mr-1" />保管</th>
                      <th className="text-left py-2 px-2 font-medium whitespace-nowrap"><Hash className="w-3 h-3 inline mr-1" />编号</th>
                      <th className="text-left py-2 px-2 font-medium whitespace-nowrap"><MessageSquare className="w-3 h-3 inline mr-1" />备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidences.map((e, i) => (
                    <tr key={e.name} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 px-2 text-slate-500 align-top">{i + 1}</td>
                      <td className="py-2 px-2 text-slate-800 align-top">{e.name}</td>
                      <td className="py-2 px-2 text-slate-700 align-top whitespace-nowrap">{fmtDate(e.obtainedDate)}</td>
                      <td className="py-2 px-2 text-slate-700 align-top">{fmtDate(e.custodian)}</td>
                      <td className="py-2 px-2 text-slate-700 align-top">{fmtDate(e.fileNo)}</td>
                      <td className="py-2 px-2 text-slate-600 align-top">{fmtDate(e.remark)}</td>
                    </tr>
                  ))}
                    {formData.customEvidence.trim() && (
                      <tr className="border-b border-slate-100 last:border-0">
                        <td className="py-2 px-2 text-slate-500 align-top">{evidences.length + 1}</td>
                        <td className="py-2 px-2 text-slate-800 align-top">{formData.customEvidence.trim()}</td>
                        <td className="py-2 px-2 text-slate-700 align-top">—</td>
                        <td className="py-2 px-2 text-slate-700 align-top">—</td>
                        <td className="py-2 px-2 text-slate-700 align-top">—</td>
                        <td className="py-2 px-2 text-slate-600 align-top">补充</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                当前填写概要
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">项目名称</dt>
                  <dd className="text-slate-800 font-medium text-right">{formData.projectName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">索赔类型</dt>
                  <dd className="text-slate-800 font-medium text-right">{claimConfig?.title || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">合同条款</dt>
                  <dd className="text-slate-800 font-medium text-right">{formData.contractClause || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">停窝工天数</dt>
                  <dd className="text-slate-800 font-medium text-right">{formData.confirmedDays ?? '—'} 天</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">索赔总费用</dt>
                  <dd className="text-slate-800 font-medium text-right">
                    {formData.incurredCost ? `¥ ${formData.incurredCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </dd>
                </div>
                {hasCostBreakdown && (
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500 mb-2">费用明细</dt>
                    <dd className="space-y-1.5">
                      {costItems.map((it) => (
                        <div key={it.id} className="flex justify-between text-xs"><span className="text-slate-600">{it.name.trim()}</span><span className="text-slate-800">¥ {(it.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></div>
                      ))}
                      <div className="flex justify-between text-xs pt-1 mt-1 border-t border-slate-100 font-medium">
                        <span className="text-slate-700">合计</span>
                        <span className="text-primary-700">¥ {totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">已收集证据</dt>
                  <dd className="text-slate-800 font-medium text-right">
                    {evidences.length + (formData.customEvidence.trim() ? 1 : 0)} 项
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
