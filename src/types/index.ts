export type ClaimType = 'owner_delay' | 'design_change' | 'material_delay';

export type LetterType = 'intent_notice' | 'claim_report' | 'reminder';

export type ToneLevel = number;

export interface CostItem {
  id: string;
  name: string;
  amount: number | null;
}

export interface EvidenceDetail {
  name: string;
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
