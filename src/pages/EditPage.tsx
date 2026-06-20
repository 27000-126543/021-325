import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Handshake,
  Scale,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { LETTER_TYPES } from '@/data/claimTypes';
import type { LetterType } from '@/types';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in">
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-warn-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-warn-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary px-5 py-2.5">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="bg-warn-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-warn-700 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditPage() {
  const navigate = useNavigate();
  const formData = useClaimStore((s) => s.formData);
  const result = useClaimStore((s) => s.result);
  const setToneLevel = useClaimStore((s) => s.setToneLevel);
  const generateLetter = useClaimStore((s) => s.generateLetter);
  const updateLetterContent = useClaimStore((s) => s.updateLetterContent);
  const [copied, setCopied] = useState(false);
  const [isManualEdited, setIsManualEdited] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'letter' | 'tone'; letterType?: LetterType; toneLevel?: number } | null>(null);

  useEffect(() => {
    if (!formData.claimType) {
      navigate('/');
      return;
    }
    if (!result) {
      generateLetter('intent_notice');
    }
  }, [formData.claimType, result, generateLetter, navigate]);

  const toneLevel = result?.toneLevel ?? 50;

  const requestAction = useCallback((action: { type: 'letter' | 'tone'; letterType?: LetterType; toneLevel?: number }) => {
    if (isManualEdited) {
      setPendingAction(action);
      setModalOpen(true);
    } else {
      executeAction(action);
    }
  }, [isManualEdited]);

  const executeAction = useCallback((action: { type: 'letter' | 'tone'; letterType?: LetterType; toneLevel?: number }) => {
    if (action.type === 'letter' && action.letterType) {
      setIsManualEdited(false);
      generateLetter(action.letterType);
    } else if (action.type === 'tone' && action.toneLevel !== undefined) {
      setIsManualEdited(false);
      setToneLevel(action.toneLevel);
    }
    setPendingAction(null);
  }, [generateLetter, setToneLevel]);

  const handleToneChange = (level: number) => {
    requestAction({ type: 'tone', toneLevel: level });
  };

  const handleLetterTypeChange = (type: LetterType) => {
    requestAction({ type: 'letter', letterType: type });
  };

  const handleContentEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsManualEdited(true);
    updateLetterContent(e.target.value);
  };

  const handleRegenerate = () => {
    if (!result) return;
    setIsManualEdited(false);
    generateLetter(result.letterType);
  };

  const handleConfirmModal = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
    setModalOpen(false);
  };

  const handleCancelModal = () => {
    setModalOpen(false);
    setPendingAction(null);
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

  const getToneLabel = () => {
    if (toneLevel <= 33) return { text: '偏商务协商', color: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-300' };
    if (toneLevel <= 66) return { text: '中性正式', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-300' };
    return { text: '偏合同维权', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' };
  };

  const toneStyle = getToneLabel();

  const totalMissing = result?.missingGroups.reduce((sum, g) => sum + g.items.length, 0) ?? 0;

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <ConfirmModal
        open={modalOpen}
        title="确认重新生成"
        message="您已手动修改过函件内容，切换函件类型或调整措辞将覆盖您的修改。确认要重新生成吗？"
        confirmLabel="确认重新生成"
        cancelLabel="保留当前内容"
        onConfirm={handleConfirmModal}
        onCancel={handleCancelModal}
      />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/preview')} className="btn-ghost flex items-center gap-2 -ml-4">
            <ArrowLeft className="w-4 h-4" />
            返回预览
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">1</span>
              填写信息
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">2</span>
              预览函件
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">3</span>
              调整措辞
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary-600" />
              函件类型
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex gap-1">
              {LETTER_TYPES.map((type) => {
                const isActive = result.letterType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleLetterTypeChange(type.id)}
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
            <p className="mt-3 text-sm text-slate-600">
              {LETTER_TYPES.find((t) => t.id === result.letterType)?.description}
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary-600" />
              调整措辞强硬程度
            </h3>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
                <Handshake className="w-4 h-4" />
                偏商务协商
              </div>
              <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${toneStyle.bg} ${toneStyle.color} ${toneStyle.border}`}>
                当前：{toneStyle.text}
              </div>
              <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                <Scale className="w-4 h-4" />
                偏合同维权
              </div>
            </div>

            <div className="relative px-3">
              <input
                type="range"
                min="0"
                max="100"
                value={toneLevel}
                onChange={(e) => handleToneChange(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>友好沟通</span>
                <span>中性正式</span>
                <span>强硬追责</span>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
              <div className={`p-4 rounded-lg border ${toneLevel <= 33 ? 'border-primary-400 bg-primary-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`font-medium mb-1.5 ${toneLevel <= 33 ? 'text-primary-700' : 'text-slate-600'}`}>偏商务协商</div>
                <p className={toneLevel <= 33 ? 'text-primary-800' : 'text-slate-500'}>
                  语气温和，强调合作关系，以"恳请""希望""友好协商"等措辞为主，适合双方关系良好、争议不大的情形。
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${toneLevel > 33 && toneLevel <= 66 ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`font-medium mb-1.5 ${toneLevel > 33 && toneLevel <= 66 ? 'text-slate-800' : 'text-slate-600'}`}>中性正式</div>
                <p className={toneLevel > 33 && toneLevel <= 66 ? 'text-slate-800' : 'text-slate-500'}>
                  语气正式中立，引用合同条款明确事实，以"正式函告""请予确认""按合同约定"等措辞为主，适用于大多数常规索赔场景。
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${toneLevel > 66 ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`font-medium mb-1.5 ${toneLevel > 66 ? 'text-red-700' : 'text-slate-600'}`}>偏合同维权</div>
                <p className={toneLevel > 66 ? 'text-red-800' : 'text-slate-500'}>
                  语气强硬严肃，引用法律依据明确违约责任，以"郑重催告""必须承担""保留仲裁/诉讼权利"等措辞为主，适合对方长期拖延、多次沟通无果的情形。
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-600" />
                函件内容（可直接编辑）
              </h3>
              <div className="flex items-center gap-3">
                {isManualEdited && (
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-800 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新生成
                  </button>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5" />
                  可直接在右侧文本框中修改措辞
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="letter-paper !p-8 !min-h-[600px]">
                <pre className="whitespace-pre-wrap font-serif text-sm leading-loose text-slate-800">
                  {result.content}
                </pre>
              </div>

              <div className="flex flex-col">
                <textarea
                  value={result.content}
                  onChange={handleContentEdit}
                  className="flex-1 w-full min-h-[600px] p-5 font-mono text-sm leading-relaxed border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
                  placeholder="函件内容..."
                />
              </div>
            </div>

            {totalMissing > 0 && (
              <div className="mt-5 bg-warn-50 border border-warn-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warn-700 font-medium text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  仍有 {totalMissing} 项事实依据缺失，请在发函前补充
                </div>
                <p className="text-xs text-warn-700">
                  返回预览页可查看按类别分组的完整缺失清单，点击可跳转填写页对应区域补充。
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-end items-stretch md:items-center">
            <button onClick={() => navigate('/preview')} className="btn-secondary flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回预览页
            </button>
            <button onClick={handleCopy} className="btn-secondary flex items-center justify-center gap-2">
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制到剪贴板' : '复制全部内容'}
            </button>
            <button onClick={handleDownload} className="btn-primary flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              导出并下载
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
