import { useNavigate } from 'react-router-dom';
import { Building2, PencilRuler, Package, FileText, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { CLAIM_TYPES } from '@/data/claimTypes';
import { useClaimStore } from '@/store/useClaimStore';
import type { ClaimType } from '@/types';

const iconMap = {
  Building2,
  PencilRuler,
  Package,
};

export default function Home() {
  const navigate = useNavigate();
  const setClaimType = useClaimStore((s) => s.setClaimType);
  const reset = useClaimStore((s) => s.reset);

  const handleSelect = (type: ClaimType) => {
    reset();
    setClaimType(type);
    navigate('/form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
              desc: '填写合同条款、事件经过、停窝工天数、费用金额，勾选现有证据，避免关键事实遗漏。',
            },
            {
              step: '02',
              title: '智能生成函件',
              desc: '系统依据索赔类型自动匹配规范模板，生成索赔意向通知、费用索赔报告或催办函。',
            },
            {
              step: '03',
              title: '标注缺失 + 调整措辞',
              desc: '醒目标注缺少的证据材料，可调整函件措辞从商务协商到合同维权，一键复制导出。',
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
        </div>
      </footer>
    </div>
  );
}
