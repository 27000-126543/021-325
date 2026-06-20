import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Info,
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { LETTER_TYPES } from '@/data/claimTypes';
import type { LetterType } from '@/types';

export default function PreviewPage() {
  const navigate = useNavigate();
  const formData = useClaimStore((s) => s.formData);
  const result = useClaimStore((s) => s.result);
  const generateLetter = useClaimStore((s) => s.generateLetter);
  const [copied, setCopied] = useState(false);

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

  if (!result) return null;

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
            {result.missingEvidences.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-warn-400 shadow-sm overflow-hidden">
                <div className="bg-warn-50 px-5 py-3.5 border-b border-warn-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warn-600" />
                  <h3 className="font-semibold text-warn-800">缺失事实依据提醒</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-600 mb-4">
                    为确保索赔函件具备完整的法律效力，请在正式发出前补充以下缺失材料：
                  </p>
                  <ul className="space-y-2.5">
                    {result.missingEvidences.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-warn-100 text-warn-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-warn-800 font-medium leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 pt-4 border-t border-warn-100">
                    <p className="text-xs text-warn-700 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      建议：缺少关键证据可能导致索赔主张不被对方认可，请尽量收集齐全后再发函。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.missingEvidences.length === 0 && (
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
                  <dt className="text-slate-500 flex-shrink-0">合同条款</dt>
                  <dd className="text-slate-800 font-medium text-right">第 {formData.contractClause || '—'} 条</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">停窝工天数</dt>
                  <dd className="text-slate-800 font-medium text-right">{formData.confirmedDays ?? '—'} 天</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">索赔费用</dt>
                  <dd className="text-slate-800 font-medium text-right">
                    {formData.incurredCost ? `¥ ${formData.incurredCost.toLocaleString()}` : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500 flex-shrink-0">已提交证据</dt>
                  <dd className="text-slate-800 font-medium text-right">{formData.evidences.length} 项</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
