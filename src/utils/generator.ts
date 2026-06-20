import type { ClaimFormData, LetterType, MissingGroup } from '@/types';
import { getClaimTypeConfig } from '@/data/claimTypes';
import { getTemplate, getLetterTitle, pickToneText } from '@/data/letterTemplates';

function numToChinese(num: number): string {
  if (num === 0) return '零元整';
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  let intStr = '';
  const intStrArr = intPart.toString().split('').reverse();

  for (let i = 0; i < intStrArr.length; i++) {
    const d = parseInt(intStrArr[i]);
    const unitIdx = i % 4;
    const bigUnitIdx = Math.floor(i / 4);

    if (d === 0) {
      if (!intStr.startsWith('零') && intStr !== '') {
        intStr = '零' + intStr;
      }
    } else {
      intStr = digits[d] + units[unitIdx] + intStr;
    }

    if (unitIdx === 3 && i > 0) {
      if (intStr.startsWith('零')) {
        intStr = intStr.slice(1);
      }
      if (!intStr.startsWith(bigUnits[bigUnitIdx]) && intStr !== '') {
        intStr = bigUnits[bigUnitIdx] + intStr;
      }
    }
  }

  if (intStr.endsWith('零')) {
    intStr = intStr.slice(0, -1);
  }

  let result = intStr || '零';

  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    result += '元';
    if (jiao > 0) {
      result += digits[jiao] + '角';
    } else if (fen > 0) {
      result += '零';
    }
    if (fen > 0) {
      result += digits[fen] + '分';
    }
  } else {
    result += '元整';
  }

  return result;
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '____年__月__日';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

function formatContractClause(input: string): string {
  const raw = input.trim();
  if (!raw) return '[合同条款编号]';

  const clauses = raw.split(/[、,，;；]/).map((s) => s.trim()).filter(Boolean);

  const normalized = clauses.map((clause) => {
    let c = clause;
    const hasPrefix = /^第\s*/.test(c);
    const hasSuffix = /\s*条$/.test(c);

    if (hasPrefix && hasSuffix) {
      c = c.replace(/^第\s*/, '第').replace(/\s*条$/, '条');
    } else if (hasPrefix && !hasSuffix) {
      c = c.replace(/^第\s*/, '第') + '条';
    } else if (!hasPrefix && hasSuffix) {
      c = '第' + c;
    } else {
      c = '第' + c + '条';
    }

    c = c.replace(/^第\s+/, '第').replace(/\s+条$/, '条');
    return c;
  });

  return normalized.join('、');
}

function buildEvidenceList(formData: ClaimFormData): string {
  const allEvidences = [...formData.evidences];
  if (formData.customEvidence.trim()) {
    allEvidences.push(formData.customEvidence.trim());
  }
  if (allEvidences.length === 0) return '';
  return '\n' + allEvidences.map((e, i) => `    ${i + 1}、${e}`).join('\n');
}

function buildCostDetailText(formData: ClaimFormData): string {
  const cb = formData.costBreakdown;
  const items: { label: string; value: number }[] = [];

  if (cb.personnelCost && cb.personnelCost > 0) {
    items.push({ label: '人员窝工费', value: cb.personnelCost });
  }
  if (cb.equipmentCost && cb.equipmentCost > 0) {
    items.push({ label: '机械闲置费', value: cb.equipmentCost });
  }
  if (cb.managementCost && cb.managementCost > 0) {
    items.push({ label: '现场管理费', value: cb.managementCost });
  }
  if (cb.materialCost && cb.materialCost > 0) {
    items.push({ label: '材料保管费', value: cb.materialCost });
  }
  if (cb.otherCost && cb.otherCost > 0) {
    const label = cb.otherCostDesc?.trim() || '其他费用';
    items.push({ label, value: cb.otherCost });
  }

  if (items.length === 0) return '';
  return '\n    费用明细如下：\n' + items.map((it) => `    ${it.label}：${formatNumber(it.value)}元`).join('\n');
}

export function generateLetter(
  formData: ClaimFormData,
  letterType: LetterType,
  toneLevel: number
): string {
  if (!formData.claimType) return '';

  const template = getTemplate(formData.claimType);
  const config = getClaimTypeConfig(formData.claimType);

  const factKey = letterType === 'intent_notice' ? 'fact_intent' : letterType === 'claim_report' ? 'fact_claim' : 'fact_reminder';
  const claimKey = letterType === 'intent_notice' ? 'claim_intent' : letterType === 'claim_report' ? 'claim_claim' : 'claim_reminder';
  const closingKey = letterType === 'intent_notice' ? 'closing_intent' : letterType === 'claim_report' ? 'closing_claim' : 'closing_reminder';

  const costValue = formData.incurredCost ?? 0;
  const daysValue = formData.confirmedDays ?? 0;

  const costDetailText = buildCostDetailText(formData);
  const claimSuffix = letterType === 'claim_report' && costDetailText ? costDetailText : '';

  const replacements: Record<string, string> = {
    projectName: formData.projectName || '[项目名称]',
    contractNumber: formData.contractNumber || '[合同编号]',
    recipient: formData.recipient || '[业主/监理单位名称]',
    sender: formData.sender || '[发函人]',
    senderDept: formData.senderDept || '[发函部门]',
    date: formatDate(formData.date),
    days: daysValue > 0 ? String(daysValue) : '[X]',
    cost: costValue > 0 ? formatNumber(costValue) : '[X]',
    costChinese: costValue > 0 ? numToChinese(costValue) : '[人民币大写]',
    contractClause: formatContractClause(formData.contractClause),
    eventDescription: formData.eventDescription ? `\n\n事实经过补充说明：${formData.eventDescription}` : '',
    persons: '[X]',
    machines: '[X]',
    evidenceList: buildEvidenceList(formData),
    eventKeyword: config?.eventKeyword || '索赔事件',
    costDetail: claimSuffix,
  };

  function applyTemplate(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] ?? '');
  }

  const title = getLetterTitle(letterType);
  const greeting = applyTemplate(pickToneText(template.greeting, toneLevel));
  const fact = applyTemplate(pickToneText(template[factKey], toneLevel));
  const basis = applyTemplate(pickToneText(template.basis, toneLevel));
  const claim = applyTemplate(pickToneText(template[claimKey], toneLevel));
  const evidence = applyTemplate(pickToneText(template.evidence, toneLevel));
  const closing = applyTemplate(pickToneText(template[closingKey], toneLevel));

  const hasEvidences = formData.evidences.length > 0 || formData.customEvidence.trim();
  const evidenceSection = hasEvidences ? evidence : '';

  const claimText = claim + replacements.costDetail;

  return (
    `${title}\n\n` +
    `${greeting}\n\n` +
    `一、事实陈述\n\n${fact}\n\n` +
    `二、合同依据\n\n${basis}\n\n` +
    `三、索赔主张\n\n${claimText}\n\n` +
    (evidenceSection ? `四、证据材料\n\n${evidenceSection}\n\n` : '') +
    `${closing}\n\n` +
    `${formData.senderDept || '[发函部门]'}\n` +
    `${formData.sender || '[发函人签字]'}\n` +
    `${formatDate(formData.date)}`
  );
}

export function detectMissingGroups(formData: ClaimFormData): MissingGroup[] {
  if (!formData.claimType) return [];
  const config = getClaimTypeConfig(formData.claimType);
  if (!config) return [];

  const factItems: { text: string; targetSection: string }[] = [];
  const contractItems: { text: string; targetSection: string }[] = [];
  const evidenceItems: { text: string; targetSection: string }[] = [];

  if (!formData.projectName.trim()) {
    factItems.push({ text: '项目名称未填写', targetSection: 'basic-info' });
  }
  if (!formData.eventDescription.trim()) {
    factItems.push({ text: '事件经过未描述（建议补充时间、地点、涉及人员、具体影响）', targetSection: 'claim-facts' });
  }
  if (formData.confirmedDays === null || formData.confirmedDays <= 0) {
    factItems.push({ text: '已确认停窝工天数未填写（天数为索赔金额计算的重要依据）', targetSection: 'claim-facts' });
  }
  if (formData.incurredCost === null || formData.incurredCost <= 0) {
    factItems.push({ text: '已发生费用金额未填写（建议填写费用明细或总金额）', targetSection: 'cost-detail' });
  }

  if (!formData.contractClause.trim()) {
    contractItems.push({ text: '合同条款编号未填写（需引用施工合同中停窝工、索赔的具体条款）', targetSection: 'claim-facts' });
  }
  if (!formData.contractNumber.trim()) {
    contractItems.push({ text: '合同编号未填写', targetSection: 'basic-info' });
  }
  if (!formData.recipient.trim()) {
    contractItems.push({ text: '收函单位未填写', targetSection: 'basic-info' });
  }

  const userEvidences = new Set(formData.evidences.map((e) => e.trim()));
  if (formData.customEvidence.trim()) {
    userEvidences.add(formData.customEvidence.trim());
  }

  for (const required of config.requiredEvidences) {
    let found = false;
    for (const user of userEvidences) {
      const requiredKey = required.replace(/[（(].*?[）)]/g, '').trim();
      const userKey = user.replace(/[（(].*?[）)]/g, '').trim();
      if (userKey.includes(requiredKey) || requiredKey.includes(userKey)) {
        found = true;
        break;
      }
    }
    if (!found) {
      evidenceItems.push({ text: `缺${required}`, targetSection: 'evidence' });
    }
  }

  const groups: MissingGroup[] = [];
  if (factItems.length > 0) {
    groups.push({ group: 'fact', groupTitle: '事实信息缺失', items: factItems });
  }
  if (contractItems.length > 0) {
    groups.push({ group: 'contract', groupTitle: '合同依据缺失', items: contractItems });
  }
  if (evidenceItems.length > 0) {
    groups.push({ group: 'evidence', groupTitle: '证据材料缺失', items: evidenceItems });
  }

  return groups;
}
