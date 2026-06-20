import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { LETTER_TYPES } from '@/data/claimTypes';
import type { LetterType } from '@/types';

export default function EditPage() {
  const navigate = useNavigate();
  const formData = useClaimStore((s) => s.formData);
  const result = useClaimStore((s) => s.result);
  const setToneLevel = useClaimStore((s) => s.setToneLevel);
  const generateLetter = useClaimStore((s) => s.generateLetter);
  const updateLetterContent = useClaimStore((s) => s.updateLetterContent);
  const [copied, setCopied] = useState(false);
  const [isManualEdited, setIsManualEdited] = useState(false);

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

  const handleToneChange = (level: number) => {
    if (isManualEdited) {
      setIsManualEdited(false);
    }
    setToneLevel(level);
  };

  const handleLetterTypeChange = (type: LetterType) => {
    setIsManualEdited(false);
    generateLetter(type);
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

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-100">
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

            {isManualEdited && (
              <div className="mt-5 flex items-center gap-2 text-sm text-warn-700 bg-warn-50 px-4 py-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>您已手动修改函件内容，调整措辞或切换函件类型将覆盖您的修改。</span>
                <button
                  onClick={handleRegenerate}
                  className="ml-auto flex items-center gap-1 text-primary-700 hover:text-primary-800 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重新生成
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-600" />
                函件内容（可直接编辑）
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5" />
                提示：可直接在右侧文本框中手动修改措辞
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

            {result.missingEvidences.length > 0 && (
              <div className="mt-5 bg-warn-50 border border-warn-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warn-700 font-medium text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  仍有 {result.missingEvidences.length} 项事实依据缺失，请在发函前补充
                </div>
                <ul className="text-sm text-warn-800 list-disc list-inside space-y-1">
                  {result.missingEvidences.slice(0, 3).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {result.missingEvidences.length > 3 && (
                    <li>另有 {result.missingEvidences.length - 3} 项...请返回预览页查看完整清单</li>
                  )}
                </ul>
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
