import { useEffect, useRef, useState } from 'react';
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
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  User,
  Hash,
  MessageSquare,
  CircleDot,
} from 'lucide-react';
import { useClaimStore } from '@/store/useClaimStore';
import { COMMON_EVIDENCES, getClaimTypeConfig } from '@/data/claimTypes';
import {
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_STATUS_COLORS,
  type EvidenceDetail,
  type CostCalcMode,
} from '@/types';

const iconMap: Record<string, typeof Building2> = {
  Building2,
  PencilRuler,
  Package,
};

const COST_MODES: { mode: CostCalcMode; label: string; hint: string }[] = [
  { mode: 'amount', label: '直接填金额', hint: '整笔一次性录入' },
  { mode: 'qty_price', label: '数量 × 单价', hint: '按件数、台班等计算' },
  { mode: 'qty_price_days', label: '数量 × 单价 × 天数', hint: '人员窝工、机械闲置' },
  { mode: 'rate_days', label: '日费率 × 天数', hint: '资金占用、现场管理' },
];

const PRESET_COSTS: { name: string; mode: CostCalcMode; unit?: string }[] = [
  { name: '人员窝工费', mode: 'qty_price_days', unit: '人' },
  { name: '机械闲置费', mode: 'qty_price_days', unit: '台' },
  { name: '现场管理费', mode: 'amount' },
  { name: '材料保管费', mode: 'amount' },
  { name: '临建维护费', mode: 'amount' },
  { name: '二次倒运费', mode: 'qty_price' },
  { name: '资金占用费', mode: 'rate_days' },
  { name: '保险费', mode: 'amount' },
  { name: '检测费', mode: 'amount' },
];

function fmtNum(n: number | null): string {
  if (n == null) return '';
  return String(n);
}

export default function FormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scrollTo = searchParams.get('scrollTo');

  const formData = useClaimStore((s) => s.formData);
  const result = useClaimStore((s) => s.result);
  const activeRecordId = useClaimStore((s) => s.activeRecordId);
  const setFormData = useClaimStore((s) => s.setFormData);
  const addCostItem = useClaimStore((s) => s.addCostItem);
  const updateCostItem = useClaimStore((s) => s.updateCostItem);
  const removeCostItem = useClaimStore((s) => s.removeCostItem);
  const toggleEvidence = useClaimStore((s) => s.toggleEvidence);
  const updateEvidenceDetail = useClaimStore((s) => s.updateEvidenceDetail);
  const generateLetter = useClaimStore((s) => s.generateLetter);
  const saveProjectToRecords = useClaimStore((s) => s.saveProjectToRecords);

  const [showPresetCosts, setShowPresetCosts] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [saveMsg, setSaveMsg] = useState<string>('');

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

  useEffect(() => {
    if (!result && formData.claimType) {
      generateLetter('intent_notice');
    }
  }, [result, formData.claimType, generateLetter]);

  const canSubmit =
    formData.projectName.trim() &&
    formData.recipient.trim() &&
    formData.contractClause.trim() &&
    formData.eventDescription.trim() &&
    formData.confirmedDays !== null &&
    formData.confirmedDays > 0 &&
    (formData.incurredCost != null || formData.costItems.some((it) => it.amount && it.amount > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;
    generateLetter('intent_notice');
    navigate('/preview');
  };

  const handleSaveProject = () => {
    const id = saveProjectToRecords();
    if (id) {
      setSaveMsg(activeRecordId ? '✓ 已更新项目归档' : '✓ 已保存为新项目归档');
      setTimeout(() => setSaveMsg(''), 2500);
    } else {
      setSaveMsg('⚠ 请先填写项目名称');
      setTimeout(() => setSaveMsg(''), 2500);
    }
  };

  const handleToggleExpandEvidence = (name: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const evidenceDetailMap: Record<string, EvidenceDetail> = {};
  for (const e of formData.evidences) {
    evidenceDetailMap[e.name] = e;
  }

  if (!claimConfig) return null;

  const totalCost = formData.incurredCost ?? 0;

  const renderEvidenceBlock = (ev: string, required: boolean) => {
    const checked = !!evidenceDetailMap[ev];
    const expanded = !!expandedEvidence[ev];
    const detail = evidenceDetailMap[ev];
    const statusColors = detail ? EVIDENCE_STATUS_COLORS[detail.status] : null;
    return (
      <div
        key={ev}
        className={`rounded-lg border transition-all ${
          checked
            ? 'border-primary-500 bg-primary-50/60'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-start gap-3 p-3.5">
          <label className="flex items-start gap-3 cursor-pointer flex-1">
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
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${checked ? 'text-primary-800 font-medium' : 'text-slate-700'}`}>
                  {ev}
                </span>
                {required && (
                  <span className="inline-flex items-center text-[10px] text-warn-700 bg-warn-100 rounded-full px-1.5 py-0.5 font-medium">
                    必备
                  </span>
                )}
                {checked && detail && statusColors && (
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} font-medium`}>
                    <CircleDot className="w-3 h-3" />
                    {EVIDENCE_STATUS_LABELS[detail.status]}
                  </span>
                )}
              </div>
            </div>
          </label>
          {checked && (
            <button
              type="button"
              onClick={() => handleToggleExpandEvidence(ev)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary-700 rounded hover:bg-white/80 transition"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
        {checked && expanded && detail && (
          <div className="px-3.5 pb-4 pt-1 grid md:grid-cols-2 gap-3 border-t border-primary-200/60 mt-1">
            <div>
              <label className="form-label text-xs">证据状态</label>
              <select
                className="input-field py-1.5 text-sm"
                value={detail.status}
                onChange={(e) => updateEvidenceDetail(ev, { status: e.target.value as any })}
              >
                {Object.entries(EVIDENCE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label text-xs flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                取得时间
              </label>
              <input
                type="date"
                className="input-field py-1.5 text-sm"
                value={detail.obtainedDate || ''}
                onChange={(e) => updateEvidenceDetail(ev, { obtainedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label text-xs flex items-center gap-1">
                <User className="w-3 h-3" />
                保管人
              </label>
              <input
                type="text"
                className="input-field py-1.5 text-sm"
                placeholder="例如：李XX"
                value={detail.custodian || ''}
                onChange={(e) => updateEvidenceDetail(ev, { custodian: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label text-xs flex items-center gap-1">
                <Hash className="w-3 h-3" />
                文件编号
              </label>
              <input
                type="text"
                className="input-field py-1.5 text-sm"
                placeholder="例如：JL-2024-0615-01"
                value={detail.fileNo || ''}
                onChange={(e) => updateEvidenceDetail(ev, { fileNo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label text-xs flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                备注
              </label>
              <input
                type="text"
                className="input-field py-1.5 text-sm"
                placeholder="例如：原件1份，存商务资料柜；或需监理签字确认"
                value={detail.remark || ''}
                onChange={(e) => updateEvidenceDetail(ev, { remark: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCostRow = (item: any, idx: number) => {
    const showQty = item.calcMode === 'qty_price' || item.calcMode === 'qty_price_days';
    const showPrice = item.calcMode !== 'amount';
    const showDays = item.calcMode === 'qty_price_days' || item.calcMode === 'rate_days';

    return (
      <div
        key={item.id}
        className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 w-6">{idx + 1}.</span>
              <input
                type="text"
                className="input-field py-1.5 text-sm flex-1"
                placeholder="费用项目名称"
                value={item.name}
                onChange={(e) => updateCostItem(item.id, { name: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input-field py-1.5 text-xs"
              style={{ width: 'auto', minWidth: 140 }}
              value={item.calcMode}
              onChange={(e) => updateCostItem(item.id, { calcMode: e.target.value as CostCalcMode })}
            >
              {COST_MODES.map((m) => (
                <option key={m.mode} value={m.mode}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeCostItem(item.id)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title="删除该行"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {showQty && (
            <div>
              <label className="form-label text-xs">
                数量 {item.unitLabel ? `(${item.unitLabel})` : ''}
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="input-field py-1.5 text-sm flex-1"
                  placeholder="0"
                  value={fmtNum(item.quantity)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateCostItem(item.id, {
                      quantity: v === '' ? null : Number(v),
                    });
                  }}
                />
                <input
                  type="text"
                  className="input-field py-1.5 text-sm w-16 !px-2 text-center"
                  placeholder="单位"
                  value={item.unitLabel || ''}
                  onChange={(e) => updateCostItem(item.id, { unitLabel: e.target.value })}
                />
              </div>
            </div>
          )}
          {showPrice && (
            <div>
              <label className="form-label text-xs">
                {item.calcMode === 'rate_days' ? '日费率 (元/天)' : '单价 (元)'}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field py-1.5 text-sm"
                placeholder="0.00"
                value={fmtNum(item.unitPrice)}
                onChange={(e) => {
                  const v = e.target.value;
                  updateCostItem(item.id, {
                    unitPrice: v === '' ? null : Number(v),
                  });
                }}
              />
            </div>
          )}
          {showDays && (
            <div>
              <label className="form-label text-xs">天数 (天)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input-field py-1.5 text-sm"
                placeholder="0"
                value={fmtNum(item.days)}
                onChange={(e) => {
                  const v = e.target.value;
                  updateCostItem(item.id, {
                    days: v === '' ? null : Number(v),
                  });
                }}
              />
            </div>
          )}
          {item.calcMode === 'amount' && (
            <div className="md:col-span-2">
              <label className="form-label text-xs">金额 (元)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field py-1.5 text-sm pl-7"
                  placeholder="0.00"
                  value={fmtNum(item.amount)}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateCostItem(item.id, {
                      amount: v === '' ? null : Number(v),
                    });
                  }}
                />
              </div>
            </div>
          )}
          <div className="md:col-span-1 flex items-end">
            <div className="w-full py-1.5 px-3 bg-primary-50 border border-primary-200 rounded-lg text-right">
              <div className="text-[10px] text-primary-600 mb-0.5">该行金额</div>
              <div className="text-sm font-bold text-primary-800">
                ¥ {item.amount != null ? item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-2 -ml-4">
            <ArrowLeft className="w-4 h-4" />
            返回首页
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
          <div className="flex-1 min-w-0">
            <div className="text-xs text-primary-700 font-medium mb-1">当前索赔类型</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-1">{claimConfig.title}</h2>
            <p className="text-sm text-slate-600">{claimConfig.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={handleSaveProject}
              className="btn-secondary flex items-center justify-center gap-1.5 !py-2 !px-3 text-sm"
            >
              <Save className="w-4 h-4" />
              {activeRecordId ? '更新归档' : '保存归档'}
            </button>
            {saveMsg && (
              <div className={`text-xs text-right font-medium ${saveMsg.startsWith('✓') ? 'text-green-600' : 'text-warn-600'}`}>
                {saveMsg}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div
            ref={(el) => { sectionRefs.current['basic-info'] = el; }}
            className="card"
          >
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

          <div
            ref={(el) => { sectionRefs.current['claim-facts'] = el; }}
            className="card"
          >
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
                  placeholder="例如：12.2 或 第 12.2 条（正文自动规范为标准格式）"
                  value={formData.contractClause}
                  onChange={(e) => setFormData({ contractClause: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  支持"12.2""第12.2条""12.2, 23.3"等多种输入，正文统一输出"第12.2条"
                </p>
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

          <div
            ref={(el) => { sectionRefs.current['cost-detail'] = el; }}
            className="card"
          >
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary-600" />
                  费用明细录入
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  按分项录入停窝工费用，支持不同计算口径。系统自动汇总并写入索赔报告正文。
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPresetCosts((v) => !v)}
                  className="btn-ghost text-sm !py-1.5 !px-3 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  快速添加常用费用
                </button>
                {showPresetCosts && (
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-20">
                    {PRESET_COSTS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          addCostItem(preset.name, preset.mode, preset.unit || '');
                          setShowPresetCosts(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 flex items-center justify-between"
                      >
                        <span>+ {preset.name}</span>
                        <span className="text-xs text-slate-400">
                          {COST_MODES.find((m) => m.mode === preset.mode)?.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {formData.costItems.map((item, idx) => renderCostRow(item, idx))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => addCostItem('新费用项', 'amount')}
                className="btn-ghost text-sm !py-2 flex items-center gap-1 text-primary-700 hover:text-primary-800"
              >
                <Plus className="w-4 h-4" />
                新增一行费用项
              </button>
              <div className="flex-1 md:flex-none min-w-[240px] max-w-md">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-primary-700 font-medium">
                    <Calculator className="w-4 h-4" />
                    费用合计（自动汇总）
                  </div>
                  <div className="text-xl font-bold text-primary-800">
                    ¥ {totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => { sectionRefs.current['evidence'] = el; }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              证据材料台账
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              勾选已收集到的证据。勾选后可展开填写<b>证据状态</b>（原件/复印件/待补盖章/待监理确认）、取得时间、保管人、文件编号和备注。
            </p>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-warn-600" />
                本索赔类型必备证据
              </h4>
              <div className="space-y-2.5">
                {claimConfig.requiredEvidences.map((ev) => renderEvidenceBlock(ev, true))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-slate-700 mb-3">其他通用证据</h4>
              <div className="space-y-2.5">
                {COMMON_EVIDENCES.map((ev) => renderEvidenceBlock(ev, false))}
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
                请填写所有必填项（带 * 标记）和至少一项费用后生成函件
              </div>
            )}
            <button onClick={() => navigate('/')} className="btn-secondary flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              生成索赔函件
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
