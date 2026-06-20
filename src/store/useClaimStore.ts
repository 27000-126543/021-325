import { create } from 'zustand';
import type {
  ClaimFormData,
  ClaimType,
  CostItem,
  CostCalcMode,
  EvidenceDetail,
  EvidenceStatus,
  GeneratedResult,
  LetterType,
  ProjectRecord,
  ProjectExportBundle,
  ToneLevel,
} from '@/types';
import { generateLetter, detectMissingGroups } from '@/utils/generator';
import { CLAIM_TYPES } from '@/data/claimTypes';

const STORAGE_KEY = 'claim_project_records_v2';

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function numOrNull(v: number | null | undefined): number | null {
  if (v == null || isNaN(v)) return null;
  return v;
}

function calcCostItemAmount(item: CostItem): number | null {
  const qty = numOrNull(item.quantity);
  const price = numOrNull(item.unitPrice);
  const days = numOrNull(item.days);

  switch (item.calcMode) {
    case 'amount':
      return numOrNull(item.amount);
    case 'qty_price':
      if (qty == null || price == null) return numOrNull(item.amount) ?? null;
      return Math.round(qty * price * 100) / 100;
    case 'qty_price_days':
      if (qty == null || price == null || days == null) return numOrNull(item.amount) ?? null;
      return Math.round(qty * price * days * 100) / 100;
    case 'rate_days':
      if (price == null || days == null) return numOrNull(item.amount) ?? null;
      return Math.round(price * days * 100) / 100;
    default:
      return numOrNull(item.amount);
  }
}

const DEFAULT_COST_ITEMS = (): CostItem[] => [
  {
    id: uid(),
    name: '人员窝工费',
    calcMode: 'qty_price_days',
    amount: null,
    quantity: null,
    unitPrice: null,
    days: null,
    unitLabel: '人',
  },
  {
    id: uid(),
    name: '机械闲置费',
    calcMode: 'qty_price_days',
    amount: null,
    quantity: null,
    unitPrice: null,
    days: null,
    unitLabel: '台',
  },
  {
    id: uid(),
    name: '现场管理费',
    calcMode: 'amount',
    amount: null,
    quantity: null,
    unitPrice: null,
    days: null,
    unitLabel: '',
  },
  {
    id: uid(),
    name: '材料保管费',
    calcMode: 'amount',
    amount: null,
    quantity: null,
    unitPrice: null,
    days: null,
    unitLabel: '',
  },
];

function defaultEvidence(name: string, status: EvidenceStatus = 'pending'): EvidenceDetail {
  return { name, status, obtainedDate: '', custodian: '', fileNo: '', remark: '' };
}

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
    const v = calcCostItemAmount(it);
    if (v != null && !isNaN(v) && v > 0) return acc + v;
    return acc;
  }, 0);
}

function recalcAmounts(items: CostItem[]): CostItem[] {
  return items.map((it) => ({ ...it, amount: calcCostItemAmount(it) }));
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

  addCostItem: (name?: string, mode?: CostCalcMode, unitLabel?: string) => void;
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

  exportProjects: () => ProjectExportBundle;
  importProjects: (bundle: ProjectExportBundle) => { added: number; total: number };

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

  addCostItem: (name?: string, mode?: CostCalcMode, unitLabel?: string) => {
    set((state) => {
      const calcMode = mode || 'amount';
      const ul =
        unitLabel != null
          ? unitLabel
          : calcMode === 'qty_price' || calcMode === 'qty_price_days'
            ? '项'
            : '';
      const item: CostItem = {
        id: uid(),
        name: name || '新费用项',
        calcMode,
        amount: null,
        quantity: null,
        unitPrice: null,
        days: null,
        unitLabel: ul,
      };
      item.amount = calcCostItemAmount(item);
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
      const items = state.formData.costItems.map((it) => {
        if (it.id !== id) return it;
        const merged = { ...it, ...patch };
        merged.amount = calcCostItemAmount(merged);
        return merged;
      });
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
      const finalItems = items.length === 0 ? DEFAULT_COST_ITEMS() : items;
      const recalc = recalcAmounts(finalItems);
      return {
        formData: {
          ...state.formData,
          costItems: recalc,
          incurredCost: sumCostItems(recalc) || null,
        },
      };
    });
  },

  recalcTotalCost: () => {
    set((state) => {
      const items = recalcAmounts(state.formData.costItems);
      const total = sumCostItems(items);
      return {
        formData: {
          ...state.formData,
          costItems: items,
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
        next = [...state.formData.evidences, defaultEvidence(evidenceName, 'original')];
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
      const updated = [newRec, ...projectRecords].slice(0, 50);
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

  exportProjects: (): ProjectExportBundle => {
    const { projectRecords } = get();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      records: JSON.parse(JSON.stringify(projectRecords)),
    };
  },

  importProjects: (bundle: ProjectExportBundle): { added: number; total: number } => {
    if (!bundle || !Array.isArray(bundle.records)) {
      return { added: 0, total: 0 };
    }
    const existing = get().projectRecords;
    const existingIds = new Set(existing.map((r) => r.id));
    let added = 0;
    const merged: ProjectRecord[] = [...existing];
    for (const raw of bundle.records) {
      if (!raw || !raw.id || !raw.formData || !raw.claimType) continue;
      if (existingIds.has(raw.id)) continue;

      const rec: ProjectRecord = { ...raw };

      rec.formData = { ...rec.formData };

      if (!Array.isArray(rec.formData.costItems)) {
        rec.formData.costItems = DEFAULT_COST_ITEMS();
      } else {
        rec.formData.costItems = rec.formData.costItems.map((it: any) => ({
          id: it.id || uid(),
          name: it.name || '',
          calcMode: it.calcMode || 'amount',
          amount: it.amount != null ? it.amount : null,
          quantity: it.quantity != null ? it.quantity : null,
          unitPrice: it.unitPrice != null ? it.unitPrice : null,
          days: it.days != null ? it.days : null,
          unitLabel: it.unitLabel || '',
        }));
      }

      if (!Array.isArray(rec.formData.evidences)) {
        rec.formData.evidences = [];
      } else {
        rec.formData.evidences = rec.formData.evidences.map((e: any) => ({
          name: e.name || '',
          status: e.status || 'original',
          obtainedDate: e.obtainedDate || '',
          custodian: e.custodian || '',
          fileNo: e.fileNo || '',
          remark: e.remark || '',
        }));
      }

      const total = sumCostItems(rec.formData.costItems);
      rec.totalCost = total > 0 ? total : rec.formData.incurredCost ?? null;
      rec.evidenceCount = rec.formData.evidences.length;

      if (rec.result) {
        rec.result = { ...rec.result };
        rec.result.missingGroups = rec.result.missingGroups || [];
      }

      merged.push(rec);
      existingIds.add(rec.id);
      added++;
    }
    merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const finalList = merged.slice(0, 100);
    saveRecords(finalList);
    set({ projectRecords: finalList });
    return { added, total: finalList.length };
  },

  reset: () => {
    set({
      formData: { ...initialFormData, costItems: DEFAULT_COST_ITEMS() },
      result: null,
      activeRecordId: null,
    });
  },
}));
