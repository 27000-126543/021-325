import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Building2,
  PencilRuler,
  Package,
  CalendarDays,
  FileCheck,
  Send,
  Check,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { COMMON_EVIDENCES, getClaimTypeConfig } from '@/data/claimTypes';

const iconMap: Record<string, typeof Building2> = {
  Building2,
  PencilRuler,
  Package,
};

export default function FormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollTo = searchParams.get('scrollTo');

  const formData = useClaimStore((s) => s.formData);
  const setFormData = useClaimStore((s) => s.setFormData);
  const setCostBreakdown = useClaimStore((s) => s.setCostBreakdown);
  const toggleEvidence = useClaimStore((s) => s.toggleEvidence);
  const generateLetter = useClaimStore((s) => s.generateLetter);

  const claimConfig = formData.claimType ? getClaimTypeConfig(formData.claimType) : null;
  const ClaimIcon = formData.claimType ? iconMap[claimConfig?.icon || 'Building2'] : FileText;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!formData.claimType) {
      navigate('/');
    }
  }, [formData.claimType, navigate]);

  useEffect(() => {
    if (scrollTo && sectionRefs.current[scrollTo]) {
      const timer = setTimeout(() => {
        sectionRefs.current[scrollTo]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [scrollTo]);

  const cb = formData.costBreakdown;

  const canSubmit =
    formData.projectName.trim() &&
    formData.recipient.trim() &&
    formData.contractClause.trim() &&
    formData.eventDescription.trim() &&
    formData.confirmedDays !== null &&
    formData.confirmedDays > 0 &&
    formData.incurredCost !== null &&
    formData.incurredCost > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    generateLetter('intent_notice');
    navigate('/preview');
  };

  if (!claimConfig) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2 -ml-4">
            <ArrowLeft className="w-4 h-4" />
            返回选择索赔类型
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span className="w-6 h-6 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-medium">1</span>
              填写信息
            </div>
            <div className="w-8 h-px bg-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-medium">2</span>
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <ClaimIcon className="w-6 h-6 text-primary-700" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-primary-700 font-medium mb-1">当前索赔类型</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{claimConfig.title}</h2>
            <p className="text-sm text-slate-600">{claimConfig.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div ref={(el) => { sectionRefs.current['basic-info'] = el; }} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              项目与函件基本信息
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">项目名称<span className="form-required">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：XX 市轨道交通 3 号线一期工程"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ projectName: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">合同编号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：HT-2024-001"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ contractNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">收函单位/人员<span className="form-required">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：XX 建设项目管理有限公司"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ recipient: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">
                  <CalendarDays className="w-4 h-4 inline mr-1" />
                  发函日期
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.date}
                  onChange={(e) => setFormData({ date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">发函部门</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：XX 建设集团有限公司商务部"
                  value={formData.senderDept}
                  onChange={(e) => setFormData({ senderDept: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">发函人</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：张某某"
                  value={formData.sender}
                  onChange={(e) => setFormData({ sender: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div ref={(el) => { sectionRefs.current['claim-facts'] = el; }} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              索赔事实与依据
            </h3>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="form-label">合同条款编号<span className="form-required">*</span></label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="例如：12.2 或 第 12.2 条（支持多种格式）"
                  value={formData.contractClause}
                  onChange={(e) => setFormData({ contractClause: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-slate-500">支持输入"12.2"、"第12.2条"等多种格式，正文将自动规范为"第12.2条"</p>
              </div>
              <div>
                <label className="form-label">已确认停窝工天数<span className="form-required">*</span></label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="天"
                  value={formData.confirmedDays ?? ''}
                  onChange={(e) => setFormData({ confirmedDays: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>
            <div>
              <label className="form-label">事件经过详细描述<span className="form-required">*</span></label>
              <textarea
                className="input-field min-h-[140px] resize-y"
                placeholder="请详细描述事件发生的时间、原因、涉及范围、我方已采取的措施、造成的实际影响等。例如：2024 年 6 月 15 日，我方接到监理单位通知，因业主方规划调整，要求现场暂停 3# 楼主体结构施工..."
                value={formData.eventDescription}
                onChange={(e) => setFormData({ eventDescription: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-slate-500">建议包含：时间、地点、原因、责任方、涉及人员/设备数量、实际影响</p>
            </div>
          </div>

          <div ref={(el) => { sectionRefs.current['cost-detail'] = el; }} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              费用明细录入
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              请分项填写停窝工期间已发生的各项费用，系统将自动汇总为索赔总金额并写入函件正文。
            </p>
            <div className="grid md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className="form-label">人员窝工费（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="含工人工资、社保等"
                  value={cb.personnelCost ?? ''}
                  onChange={(e) => setCostBreakdown({ personnelCost: e.target.value ? Number(e.target.value) : null })}
                />
                <p className="mt-1 text-xs text-slate-500">停窝工期间现场人员工资、社保、住宿等费用</p>
              </div>
              <div>
                <label className="form-label">机械闲置费（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="含租赁费、折旧等"
                  value={cb.equipmentCost ?? ''}
                  onChange={(e) => setCostBreakdown({ equipmentCost: e.target.value ? Number(e.target.value) : null })}
                />
                <p className="mt-1 text-xs text-slate-500">塔吊、挖掘机等机械设备的租赁费或折旧费</p>
              </div>
              <div>
                <label className="form-label">现场管理费（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="含管理人员工资、办公费等"
                  value={cb.managementCost ?? ''}
                  onChange={(e) => setCostBreakdown({ managementCost: e.target.value ? Number(e.target.value) : null })}
                />
                <p className="mt-1 text-xs text-slate-500">停工期间项目管理人员的工资、办公费、临时设施维护费</p>
              </div>
              <div>
                <label className="form-label">材料保管费（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="含仓储、损耗等"
                  value={cb.materialCost ?? ''}
                  onChange={(e) => setCostBreakdown({ materialCost: e.target.value ? Number(e.target.value) : null })}
                />
                <p className="mt-1 text-xs text-slate-500">已进场材料的保管、仓储、防护损耗等费用</p>
              </div>
              <div>
                <label className="form-label">其他费用（元）</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="如有其他费用项"
                  value={cb.otherCost ?? ''}
                  onChange={(e) => setCostBreakdown({ otherCost: e.target.value ? Number(e.target.value) : null })}
                />
                <p className="mt-1 text-xs text-slate-500">如资金占用成本、保险费、检测费等</p>
              </div>
              {cb.otherCost !== null && cb.otherCost > 0 && (
                <div>
                  <label className="form-label">其他费用说明</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="例如：资金占用成本"
                    value={cb.otherCostDesc}
                    onChange={(e) => setCostBreakdown({ otherCostDesc: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
                <Calculator className="w-4 h-4" />
                费用合计（自动汇总）
              </div>
              <div className="text-lg font-bold text-primary-800">
                {formData.incurredCost ? `¥ ${formData.incurredCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '¥ 0.00'}
              </div>
            </div>
          </div>

          <div ref={(el) => { sectionRefs.current['evidence'] = el; }} className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              现有证据材料
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              请勾选您目前已收集到的证据材料。未勾选的必备证据将在预览时醒目标注提醒。
            </p>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-warn-600" />
                本索赔类型必备证据
              </h4>
              <div className="grid md:grid-cols-2 gap-2.5">
                {claimConfig.requiredEvidences.map((ev) => {
                  const checked = formData.evidences.includes(ev);
                  return (
                    <label
                      key={ev}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          checked ? 'bg-primary-600 border-primary-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => toggleEvidence(ev)}
                      />
                      <span className={`text-sm ${checked ? 'text-primary-800 font-medium' : 'text-slate-700'}`}>
                        {ev}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-700 mb-3">其他通用证据</h4>
              <div className="grid md:grid-cols-2 gap-2.5">
                {COMMON_EVIDENCES.map((ev) => {
                  const checked = formData.evidences.includes(ev);
                  return (
                    <label
                      key={ev}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                          checked ? 'bg-primary-600 border-primary-600' : 'border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => toggleEvidence(ev)}
                      />
                      <span className={`text-sm ${checked ? 'text-primary-800' : 'text-slate-700'}`}>
                        {ev}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="form-label">补充其他证据材料</label>
              <input
                type="text"
                className="input-field"
                placeholder="如有其他证据材料，请在此补充，例如：第三方检测报告、公证书等"
                value={formData.customEvidence}
                onChange={(e) => setFormData({ customEvidence: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:justify-end items-stretch md:items-center sticky bottom-6">
            {!canSubmit && (
              <div className="flex items-center gap-2 text-sm text-warn-700 bg-warn-50 px-4 py-3 rounded-lg md:mr-auto">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                请填写所有必填项（带 * 标记）后生成函件
              </div>
            )}
            <button onClick={() => navigate('/')} className="btn-secondary flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              上一步
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              生成索赔函件
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
