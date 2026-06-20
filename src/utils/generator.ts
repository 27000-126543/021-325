import type { ClaimFormData, LetterType } from '@/types';
import { getClaimTypeConfig } from '@/data/claimTypes';
import { getTemplate, getLetterTitle, pickToneText } from '@/data/letterTemplates';

function numToChinese(num: number): string {
  if (num === 0) return '零';
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

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
    if (jiao > 0) result += digits[jiao] + '角';
    if (fen > 0) result += digits[fen] + '分';
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

function buildEvidenceList(formData: ClaimFormData): string {
  const allEvidences = [...formData.evidences];
  if (formData.customEvidence.trim()) {
    allEvidences.push(formData.customEvidence.trim());
  }
  if (allEvidences.length === 0) return '';
  return '\n' + allEvidences.map((e, i) => `    ${i + 1}、${e}`).join('\n');
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
    contractClause: formData.contractClause || '[合同条款编号]',
    eventDescription: formData.eventDescription ? `\n\n事实经过补充说明：${formData.eventDescription}` : '',
    persons: '[X]',
    machines: '[X]',
    evidenceList: buildEvidenceList(formData),
    eventKeyword: config?.eventKeyword || '索赔事件',
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

  return (
    `${title}\n\n` +
    `${greeting}\n\n` +
    `一、事实陈述\n\n${fact}\n\n` +
    `二、合同依据\n\n${basis}\n\n` +
    `三、索赔主张\n\n${claim}\n\n` +
    (evidenceSection ? `四、证据材料\n\n${evidenceSection}\n\n` : '') +
    `${closing}\n\n` +
    `${formData.senderDept || '[发函部门]'}\n` +
    `${formData.sender || '[发函人签字]'}\n` +
    `${formatDate(formData.date)}`
  );
}

export function detectMissingEvidences(formData: ClaimFormData): string[] {
  if (!formData.claimType) return [];
  const config = getClaimTypeConfig(formData.claimType);
  if (!config) return [];

  const missing: string[] = [];
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
      missing.push(required);
    }
  }

  const criticalMissing: string[] = [];

  if (!formData.contractClause.trim()) {
    criticalMissing.push('合同条款编号（未填写引用的具体合同条款）');
  }
  if (!formData.eventDescription.trim()) {
    criticalMissing.push('事件经过详细描述（建议补充时间、地点、涉及人员、具体影响）');
  }
  if (formData.confirmedDays === null || formData.confirmedDays <= 0) {
    criticalMissing.push('已确认停窝工天数（天数为索赔金额计算的重要依据）');
  }
  if (formData.incurredCost === null || formData.incurredCost <= 0) {
    criticalMissing.push('已发生费用金额（建议附详细费用计算明细）');
  }
  if (!formData.projectName.trim()) {
    criticalMissing.push('项目名称');
  }

  return [...criticalMissing, ...missing];
}
