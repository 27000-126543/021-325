import { create } from 'zustand';
import type { ClaimFormData, ClaimType, CostBreakdown, GeneratedResult, LetterType, ToneLevel } from '@/types';
import { generateLetter, detectMissingGroups } from '@/utils/generator';
import { CLAIM_TYPES } from '@/data/claimTypes';

interface ClaimStore {
  formData: ClaimFormData;
  result: GeneratedResult | null;
  setClaimType: (type: ClaimType) => void;
  setFormData: (data: Partial<ClaimFormData>) => void;
  setCostBreakdown: (data: Partial<CostBreakdown>) => void;
  toggleEvidence: (evidence: string) => void;
  generateLetter: (letterType: LetterType) => void;
  setToneLevel: (level: ToneLevel) => void;
  updateLetterContent: (content: string) => void;
  recalcTotalCost: () => void;
  reset: () => void;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const initialCostBreakdown: CostBreakdown = {
  personnelCost: null,
  equipmentCost: null,
  managementCost: null,
  materialCost: null,
  otherCost: null,
  otherCostDesc: '',
};

const initialFormData: ClaimFormData = {
  claimType: null,
  contractClause: '',
  eventDescription: '',
  confirmedDays: null,
  incurredCost: null,
  costBreakdown: { ...initialCostBreakdown },
  evidences: [],
  customEvidence: '',
  projectName: '',
  contractNumber: '',
  recipient: '',
  sender: '',
  senderDept: '',
  date: getToday(),
};

function sumCostBreakdown(cb: CostBreakdown): number {
  let total = 0;
  if (cb.personnelCost && cb.personnelCost > 0) total += cb.personnelCost;
  if (cb.equipmentCost && cb.equipmentCost > 0) total += cb.equipmentCost;
  if (cb.managementCost && cb.managementCost > 0) total += cb.managementCost;
  if (cb.materialCost && cb.materialCost > 0) total += cb.materialCost;
  if (cb.otherCost && cb.otherCost > 0) total += cb.otherCost;
  return total;
}

export const useClaimStore = create<ClaimStore>((set, get) => ({
  formData: initialFormData,
  result: null,

  setClaimType: (type: ClaimType) => {
    set((state) => ({
      formData: { ...state.formData, claimType: type, evidences: [] },
    }));
  },

  setFormData: (data: Partial<ClaimFormData>) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
  },

  setCostBreakdown: (data: Partial<CostBreakdown>) => {
    set((state) => {
      const newCb = { ...state.formData.costBreakdown, ...data };
      const total = sumCostBreakdown(newCb);
      return {
        formData: {
          ...state.formData,
          costBreakdown: newCb,
          incurredCost: total > 0 ? total : null,
        },
      };
    });
  },

  toggleEvidence: (evidence: string) => {
    set((state) => {
      const exists = state.formData.evidences.includes(evidence);
      return {
        formData: {
          ...state.formData,
          evidences: exists
            ? state.formData.evidences.filter((e) => e !== evidence)
            : [...state.formData.evidences, evidence],
        },
      };
    });
  },

  recalcTotalCost: () => {
    set((state) => {
      const total = sumCostBreakdown(state.formData.costBreakdown);
      return {
        formData: {
          ...state.formData,
          incurredCost: total > 0 ? total : null,
        },
      };
    });
  },

  generateLetter: (letterType: LetterType) => {
    const { formData, result } = get();
    const toneLevel = result?.toneLevel ?? 50;
    if (!formData.claimType) return;

    const content = generateLetter(formData, letterType, toneLevel);
    const missingGroups = detectMissingGroups(formData);

    set({
      result: {
        letterType,
        content,
        missingGroups,
        toneLevel,
      },
    });
  },

  setToneLevel: (level: ToneLevel) => {
    const { formData, result } = get();
    if (!formData.claimType || !result) {
      set({
        result: {
          letterType: 'intent_notice',
          content: '',
          missingGroups: [],
          toneLevel: level,
        },
      });
      return;
    }
    const content = generateLetter(formData, result.letterType, level);
    const missingGroups = detectMissingGroups(formData);
    set({
      result: {
        ...result,
        toneLevel: level,
        content,
        missingGroups,
      },
    });
  },

  updateLetterContent: (content: string) => {
    set((state) => {
      if (!state.result) return state;
      return { result: { ...state.result, content } };
    });
  },

  reset: () => {
    set({
      formData: { ...initialFormData, costBreakdown: { ...initialCostBreakdown } },
      result: null,
    });
  },
}));
