"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToiletFilters } from "@/types/toilet";

// ─── Map Store ───────────────────────────────────────

interface MapState {
  center: [number, number];
  zoom: number;
  selectedToiletId: string | null;
  filters: ToiletFilters;
  isFilterSheetOpen: boolean;

  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  selectToilet: (id: string | null) => void;
  setFilters: (filters: Partial<ToiletFilters>) => void;
  clearFilters: () => void;
  toggleFilterSheet: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      center: [116.397428, 39.90923] as [number, number],
      zoom: 14,
      selectedToiletId: null,
      filters: {},
      isFilterSheetOpen: false,

      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      selectToilet: (id) => set({ selectedToiletId: id }),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      clearFilters: () => set({ filters: {} }),
      toggleFilterSheet: () =>
        set((state) => ({ isFilterSheetOpen: !state.isFilterSheetOpen })),
    }),
    {
      name: "map-store",
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
        filters: state.filters,
      }),
    }
  )
);

// ─── Gut Log Draft Store ─────────────────────────────

interface GutLogDraft {
  loggedAt?: string;
  bristolScore?: number;
  urgencyLevel?: number;
  painLevel?: number;
  toiletId?: string;
  notes?: string;
  meals?: Array<{
    foodName: string;
    category?: string;
    portion?: string;
    mealTime?: string;
  }>;
  symptoms?: Array<{ type: string; severity: number }>;
  currentStep?: number;
}

interface GutLogDraftState {
  draft: GutLogDraft | null;
  setDraft: (draft: GutLogDraft | null) => void;
  clearDraft: () => void;
}

export const useGutLogDraftStore = create<GutLogDraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: "gut-log-draft",
    }
  )
);

// ─── User Preferences Store ──────────────────────────

interface UserPrefsState {
  defaultMaxToiletDistance: number;
  homeLocation: { lng: number; lat: number } | null;
  setDefaultMaxToiletDistance: (distance: number) => void;
  setHomeLocation: (location: { lng: number; lat: number } | null) => void;
}

export const useUserPrefsStore = create<UserPrefsState>()(
  persist(
    (set) => ({
      defaultMaxToiletDistance: 500,
      homeLocation: null,
      setDefaultMaxToiletDistance: (distance) =>
        set({ defaultMaxToiletDistance: distance }),
      setHomeLocation: (location) => set({ homeLocation: location }),
    }),
    {
      name: "user-prefs",
    }
  )
);
