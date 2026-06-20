export type ClaimType = 'owner_delay' | 'design_change' | 'material_delay';

export type LetterType = 'intent_notice' | 'claim_report' | 'reminder';

export type ToneLevel = number;

export type CostCalcMode = 'amount' | 'qty_price' | 'qty_price_days' | 'rate_days';

export interface CostItem {
  id: string;
  name: string;
  calcMode: CostCalcMode;
  amount: number | null;
  quantity: number | null;
  unitPrice: number | null;
  days: number | null;
  unitLabel: string;
}

export type EvidenceStatus = 'original' | 'copy' | 'pending_seal' | 'pending_supervisor' | 'pending';

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  original: '原件齐全',
  copy: '复印件',
  pending_seal: '待补盖章',
  pending_supervisor: '待监理确认',
  pending: '未提供',
};

export const EVIDENCE_STATUS_COLORS: Record<EvidenceStatus, { bg: string; text: string; dot: string }> = {
  original: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  copy: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pending_seal: { bg: 'bg-warn-50', text: 'text-warn-700', dot: 'bg-warn-500' },
  pending_supervisor: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  pending: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export interface EvidenceDetail {
  name: string;
  status: EvidenceStatus;
  obtainedDate: string;
  custodian: string;
  fileNo: string;
  remark: string;
}

export interface ClaimFormData {
  claimType: ClaimType | null;
  contractClause: string;
  eventDescription: string;
  confirmedDays: number | null;
  incurredCost: number | null;
  costItems: CostItem[];
  evidences: EvidenceDetail[];
  customEvidence: string;
  projectName: string;
  contractNumber: string;
  recipient: string;
  sender: string;
  senderDept: string;
  date: string;
}

export interface MissingGroup {
  group: 'fact' | 'contract' | 'evidence';
  groupTitle: string;
  items: MissingItem[];
}

export interface MissingItem {
  text: string;
  targetSection: string;
}

export interface GeneratedResult {
  letterType: LetterType;
  content: string;
  missingGroups: MissingGroup[];
  toneLevel: ToneLevel;
}

export interface ClaimTypeConfig {
  id: ClaimType;
  title: string;
  description: string;
  icon: string;
  requiredEvidences: string[];
  eventKeyword: string;
}

export interface LetterTemplate {
  title: string;
  sections: {
    greeting: ToneVariant;
    fact: ToneVariant;
    basis: ToneVariant;
    claim: ToneVariant;
    evidence: ToneVariant;
    closing: ToneVariant;
  };
}

export interface ToneVariant {
  soft: string;
  medium: string;
  hard: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  claimType: ClaimType;
  createdAt: string;
  updatedAt: string;
  totalCost: number | null;
  confirmedDays: number | null;
  evidenceCount: number;
  formData: ClaimFormData;
  result: GeneratedResult | null;
}

export interface ProjectExportBundle {
  version: 1;
  exportedAt: string;
  records: ProjectRecord[];
}
