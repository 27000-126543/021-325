import type { ClaimTypeConfig } from '@/types';

export const CLAIM_TYPES: ClaimTypeConfig[] = [
  {
    id: 'owner_delay',
    title: '业主原因停工',
    description: '因业主方未按时交付施工场地、工程付款延迟、指令错误或变更通知不及时等原因导致的全面停工索赔',
    icon: 'Building2',
    requiredEvidences: [
      '监理工程师签发的停工令',
      '业主方书面停工通知或函件',
      '停工期间人员考勤记录',
      '机械设备租赁协议及闲置证明',
      '现场材料进场及保管记录',
    ],
    eventKeyword: '业主方原因停工',
  },
  {
    id: 'design_change',
    title: '设计变更导致窝工',
    description: '因设计图纸重大变更、技术交底不清或图纸延误交付，导致施工人员窝工和机械闲置的费用索赔',
    icon: 'PencilRuler',
    requiredEvidences: [
      '设计变更通知单（含设计单位签章）',
      '工程洽商记录及现场签证',
      '人员窝工考勤表（含工种、人数）',
      '机械闲置签证单（含设备型号、台时）',
      '变更前后现场对比照片',
    ],
    eventKeyword: '设计变更窝工',
  },
  {
    id: 'material_delay',
    title: '甲供材料延误',
    description: '因甲方供应的材料、设备未按计划时间进场，导致工期延误和施工人员、机械设备待料窝工的索赔',
    icon: 'Package',
    requiredEvidences: [
      '甲供材料/设备需求计划申报表',
      '材料进场延误确认单（监理签字）',
      '待料期间人员窝工记录',
      '机械设备闲置证明及台班记录',
      '工期延误签证单',
    ],
    eventKeyword: '甲供材料延误',
  },
];

export const LETTER_TYPES = [
  { id: 'intent_notice', title: '索赔意向通知', description: '索赔事件发生后 28 天内发出，表明索赔意向并简述事由' },
  { id: 'claim_report', title: '费用索赔报告', description: '详细阐述索赔事实、合同依据、费用计算及证据清单' },
  { id: 'reminder', title: '索赔催办函', description: '索赔报告提交后对方未答复时，催促对方及时处理并回复' },
] as const;

export const COMMON_EVIDENCES = [
  '工程合同及补充协议',
  '中标通知书、投标文件',
  '施工图纸及技术规范',
  '会议纪要、往来函件',
  '施工日志、天气记录',
  '工程量签证单',
  '付款凭证及发票',
  '分包合同及付款凭证',
];

export function getClaimTypeConfig(id: ClaimTypeConfig['id']): ClaimTypeConfig | undefined {
  return CLAIM_TYPES.find((c) => c.id === id);
}
