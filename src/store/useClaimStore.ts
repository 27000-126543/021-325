import { create } from 'zustand';
import type { ClaimFormData, ClaimType, GeneratedResult, LetterType, ToneLevel } from '@/types';
import { generateLetter, detectMissingEvidences } from '@/utils/generator';
import { CLAIM_TYPES } from '@/data/claimTypes';

interface ClaimStore {
  formData: ClaimFormData;
  result: GeneratedResult | null;
  setClaimType: (type: ClaimType) => void;
  setFormData: (data: Partial<ClaimFormData>) => void;
  toggleEvidence: (evidence: string) => void;
  generateLetter: (letterType: LetterType) => void;
  setToneLevel: (level: ToneLevel) => void;
  updateLetterContent: (content: string) => void;
  reset: () => void;
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const initialFormData: ClaimFormData = {
  claimType: null,
  contractClause: '',
  eventDescription: '',
  confirmedDays: null,
  incurredCost: null,
  evidences: [],
  customEvidence: '',
  projectName: '',
  contractNumber: '',
  recipient: '',
  sender: '',
  senderDept: '',
  date: getToday(),
};

export const useClaimStore = create<ClaimStore>((set, get) => ({
  formData: initialFormData,
  result: null,

  setClaimType: (type: ClaimType) => {
    const config = CLAIM_TYPES.find((c) => c.id === type);
    const defaultEvidences = config ? [config.requiredEvidences[0]] : [];
    set((state) => ({
      formData: { ...state.formData, claimType: type, evidences: defaultEvidences },
    }));
  },

  setFormData: (data: Partial<ClaimFormData>) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
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

  generateLetter: (letterType: LetterType) => {
    const { formData, result } = get();
    const toneLevel = result?.toneLevel ?? 50;
    if (!formData.claimType) return;

    const content = generateLetter(formData, letterType, toneLevel);
    const missingEvidences = detectMissingEvidences(formData);

    set({
      result: {
        letterType,
        content,
        missingEvidences,
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
          missingEvidences: [],
          toneLevel: level,
        },
      });
      return;
    }
    const content = generateLetter(formData, result.letterType, level);
    const missingEvidences = detectMissingEvidences(formData);
    set({
      result: {
        ...result,
        toneLevel: level,
        content,
        missingEvidences,
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
      formData: initialFormData,
      result: null,
    });
  },
}));
