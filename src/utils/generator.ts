import type { ClaimFormData, LetterType, MissingGroup } from '@/types';
import { getClaimTypeConfig } from '@/data/claimTypes';
import { getTemplate, getLetterTitle, pickToneText } from '@/data/letterTemplates';

function numToChinese(num: number): string {
  if (!isFinite(num)) return '零元整';
  if (num === 0) return '零元整';

  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];

  const sign = num < 0 ? '负' : '';
  const abs = Math.abs(num);
  const intPart = Math.floor(abs);
  const decPart = Math.round((abs - intPart) * 100);

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

  while (intStr.endsWith('零')) {
    intStr = intStr.slice(0, -1);
  }

  const intFinal = intStr || '零';

  const jiao = Math.floor(decPart / 10);
  const fen = decPart % 10;

  let decStr = '';
  if (jiao === 0 && fen === 0) {
    decStr = '元整';
  } else {
    decStr = '元';
    if (jiao > 0) {
      decStr += digits[jiao] + '角';
    } else if (fen > 0) {
      decStr += '零';
    }
    if (fen > 0) {
      decStr += digits[fen] + '分';
    }
  }

  return sign + intFinal + decStr;
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

function normalizeSingleClause(raw: string): string {
  const s = raw.trim().replace(/\s+/g, '');
  if (!s) return '';
  let out = s;
  out = out.replace(/^第+/, '第');
  out = out.replace(/条+$/, '条');
  if (!out.startsWith('第')) out = '第' + out;
  if (!out.endsWith('条')) out = out + '条';
  return out;
}

function formatContractClause(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '[合同条款编号]';
  const parts = raw.split(/[、,，;；\/\\]/).map((s) => s.trim()).filter(Boolean);
  const normalized = parts.map(normalizeSingleClause).filter(Boolean);
  const dedup = Array.from(new Set(normalized));
  return dedup.length ? dedup.join('、') : '[合同条款编号]';
}

function buildEvidenceList(formData: ClaimFormData): string {
  const names: string[] = formData.evidences.map((e) => e.name);
  if (formData.customEvidence.trim()) {
    names.push(formData.customEvidence.trim());
  }
  if (names.length === 0) return '';
  return '\n' + names.map((e, i) => `    ${i + 1}、${e}`).join('\n');
}

function buildEvidenceCatalogue(formData: ClaimFormData): string {
  const rows = formData.evidences
    .filter((e) => e.name.trim())
    .map((e) => ({
      no: 0,
      name: e.name,
      date: e.obtainedDate || '—',
      custodian: e.custodian || '—',
      fileNo: e.fileNo || '—',
      remark: e.remark || '—',
    }));
  if (formData.customEvidence.trim()) {
    rows.push({
      no: 0,
      name: formData.customEvidence.trim(),
      date: '—',
      custodian: '—',
      fileNo: '—',
      remark: '补充证据',
    });
  }
  if (rows.length === 0) return '';

  const header = `    序号  证据名称                  取得时间      保管人      文件编号      备注`;
  const sep = `    ${'—'.repeat(90)}`;
  const lines = rows.map((r, i) => {
    const no = String(i + 1).padEnd(4);
    const name = (r.name.length > 22 ? r.name.slice(0, 21) + '…' : r.name).padEnd(24);
    const date = r.date.padEnd(12);
    const custodian = (r.custodian.length > 8 ? r.custodian.slice(0, 7) + '…' : r.custodian).padEnd(10);
    const fileNo = (r.fileNo.length > 10 ? r.fileNo.slice(0, 9) + '…' : r.fileNo).padEnd(12);
    const remark = r.remark.length > 14 ? r.remark.slice(0, 13) + '…' : r.remark;
    return `    ${no}${name}${date}${custodian}${fileNo}${remark}`;
  });

  return '\n证据目录：\n\n' + header + '\n' + sep + '\n' + lines.join('\n');
}

function buildCostDetailText(formData: ClaimFormData): string {
  const items = formData.costItems.filter(
    (it) => it.name.trim() && it.amount != null && !isNaN(it.amount) && it.amount > 0
  );
  if (items.length === 0) return '';

  const lines = items.map((it) => `    ${it.name.trim()}：${formatNumber(it.amount!)}元`);
  const total = items.reduce((acc, it) => acc + (it.amount || 0), 0);

  return (
    '\n    费用明细如下：\n' +
    lines.join('\n') +
    `\n    以上合计：${formatNumber(total)}元（大写：${numToChinese(total)}）`
  );
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

  const evidenceCatalogue = letterType === 'claim_report' ? buildEvidenceCatalogue(formData) : '';

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
    evidenceCatalogue: evidenceCatalogue ? `\n\n${evidenceCatalogue}` : '',
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
  const evidenceSection = hasEvidences ? evidence + replacements.evidenceCatalogue : '';

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
  const hasCost =
    formData.incurredCost != null && formData.incurredCost > 0 && isFinite(formData.incurredCost);
  const hasAnyCostItem = formData.costItems.some(
    (it) => it.amount != null && !isNaN(it.amount) && it.amount > 0
  );
  if (!hasCost && !hasAnyCostItem) {
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

  const userEvidences = new Set(formData.evidences.map((e) => e.name.trim()).filter(Boolean));
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
