import { create } from 'zustand';
import type { ClaimFormData, ClaimType, CostItem, EvidenceDetail, GeneratedResult, LetterType, ProjectRecord, ToneLevel } from '@/types';
import { generateLetter, detectMissingGroups } from '@/utils/generator';
import { CLAIM_TYPES } from '@/data/claimTypes';

const STORAGE_KEY = 'claim_project_records_v1';

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_COST_ITEMS = (): CostItem[] => [
  { id: uid(), name: '人员窝工费', amount: null },
  { id: uid(), name: '机械闲置费', amount: null },
  { id: uid(), name: '现场管理费', amount: null },
  { id: uid(), name: '材料保管费', amount: null },
];

const initialFormData: ClaimFormData = {
  claimType: null,
  contractClause: '',
  eventDescription: '',
  confirmedDays: null,
  incurredCost: null,
  costItems: DEFAULT_COST_ITEMS(),
  evidences: [],
  customEvidence: '',
  projectName: '',
  contractNumber: '',
  recipient: '',
  sender: '',
  senderDept: '',
  date: getToday(),
};

function sumCostItems(items: CostItem[]): number {
  return items.reduce((acc, it) => {
    if (it.amount != null && !isNaN(it.amount) && it.amount > 0) return acc + it.amount;
    return acc;
  }, 0);
}

function loadRecords(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecords(records: ProjectRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* ignore */
  }
}

interface ClaimStore {
  formData: ClaimFormData;
  result: GeneratedResult | null;
  projectRecords: ProjectRecord[];
  activeRecordId: string | null;

  setClaimType: (type: ClaimType) => void;
  setFormData: (data: Partial<ClaimFormData>) => void;

  addCostItem: (name?: string) => void;
  updateCostItem: (id: string, patch: Partial<CostItem>) => void;
  removeCostItem: (id: string) => void;
  recalcTotalCost: () => void;

  toggleEvidence: (evidenceName: string) => void;
  updateEvidenceDetail: (name: string, patch: Partial<EvidenceDetail>) => void;

  generateLetter: (letterType: LetterType) => void;
  setToneLevel: (level: ToneLevel) => void;
  updateLetterContent: (content: string) => void;

  saveProjectToRecords: () => string | null;
  loadProjectRecord: (id: string) => void;
  deleteProjectRecord: (id: string) => void;
  clearActiveRecord: () => void;

  reset: () => void;
}

export const useClaimStore = create<ClaimStore>((set, get) => ({
  formData: { ...initialFormData, costItems: DEFAULT_COST_ITEMS() },
  result: null,
  projectRecords: loadRecords(),
  activeRecordId: null,

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

  addCostItem: (name?: string) => {
    set((state) => {
      const item: CostItem = { id: uid(), name: name || '新费用项', amount: null };
      const items = [...state.formData.costItems, item];
      return {
        formData: {
          ...state.formData,
          costItems: items,
          incurredCost: sumCostItems(items) || null,
        },
      };
    });
  },

  updateCostItem: (id: string, patch: Partial<CostItem>) => {
    set((state) => {
      const items = state.formData.costItems.map((it) => (it.id === id ? { ...it, ...patch } : it));
      return {
        formData: {
          ...state.formData,
          costItems: items,
          incurredCost: sumCostItems(items) || null,
        },
      };
    });
  },

  removeCostItem: (id: string) => {
    set((state) => {
      const items = state.formData.costItems.filter((it) => it.id !== id);
      return {
        formData: {
          ...state.formData,
          costItems: items.length === 0 ? DEFAULT_COST_ITEMS() : items,
          incurredCost: sumCostItems(items.length === 0 ? DEFAULT_COST_ITEMS() : items) || null,
        },
      };
    });
  },

  recalcTotalCost: () => {
    set((state) => {
      const total = sumCostItems(state.formData.costItems);
      return {
        formData: {
          ...state.formData,
          incurredCost: total > 0 ? total : null,
        },
      };
    });
  },

  toggleEvidence: (evidenceName: string) => {
    set((state) => {
      const existsIdx = state.formData.evidences.findIndex((e) => e.name === evidenceName);
      let next: EvidenceDetail[];
      if (existsIdx >= 0) {
        next = state.formData.evidences.filter((e) => e.name !== evidenceName);
      } else {
        next = [
          ...state.formData.evidences,
          { name: evidenceName, obtainedDate: '', custodian: '', fileNo: '', remark: '' },
        ];
      }
      return { formData: { ...state.formData, evidences: next } };
    });
  },

  updateEvidenceDetail: (name: string, patch: Partial<EvidenceDetail>) => {
    set((state) => {
      const next = state.formData.evidences.map((e) => (e.name === name ? { ...e, ...patch } : e));
      return { formData: { ...state.formData, evidences: next } };
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

  saveProjectToRecords: () => {
    const { formData, result, projectRecords, activeRecordId } = get();
    if (!formData.claimType || !formData.projectName.trim()) return null;

    const now = new Date().toISOString();
    const total = sumCostItems(formData.costItems);
    const recordName = formData.projectName.trim();

    if (activeRecordId) {
      const updated = projectRecords.map((r) =>
        r.id === activeRecordId
          ? {
              ...r,
              name: recordName,
              claimType: formData.claimType!,
              updatedAt: now,
              totalCost: total > 0 ? total : formData.incurredCost ?? null,
              confirmedDays: formData.confirmedDays,
              evidenceCount: formData.evidences.length,
              formData,
              result,
            }
          : r
      );
      saveRecords(updated);
      set({ projectRecords: updated });
      return activeRecordId;
    } else {
      const newRec: ProjectRecord = {
        id: uid(),
        name: recordName,
        claimType: formData.claimType,
        createdAt: now,
        updatedAt: now,
        totalCost: total > 0 ? total : formData.incurredCost ?? null,
        confirmedDays: formData.confirmedDays,
        evidenceCount: formData.evidences.length,
        formData,
        result,
      };
      const updated = [newRec, ...projectRecords].slice(0, 20);
      saveRecords(updated);
      set({ projectRecords: updated, activeRecordId: newRec.id });
      return newRec.id;
    }
  },

  loadProjectRecord: (id: string) => {
    const rec = get().projectRecords.find((r) => r.id === id);
    if (!rec) return;
    set({
      formData: { ...rec.formData },
      result: rec.result ? { ...rec.result } : null,
      activeRecordId: rec.id,
    });
  },

  deleteProjectRecord: (id: string) => {
    set((state) => {
      const updated = state.projectRecords.filter((r) => r.id !== id);
      saveRecords(updated);
      return {
        projectRecords: updated,
        activeRecordId: state.activeRecordId === id ? null : state.activeRecordId,
      };
    });
  },

  clearActiveRecord: () => {
    set({ activeRecordId: null });
  },

  reset: () => {
    set({
      formData: { ...initialFormData, costItems: DEFAULT_COST_ITEMS() },
      result: null,
      activeRecordId: null,
    });
  },
}));
