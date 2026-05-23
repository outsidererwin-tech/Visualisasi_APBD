import { useState, useMemo, useEffect } from 'react';
import { APBDData, SikdRecord, SikdAllocationRecord } from '../types';
import { APBDService } from '../services/apbdService';
import { MOCK_DATA } from '../mockData';
import { MOCK_SIKD_DATA } from '../mockSikdData';
import { MOCK_SIKD_ALLOCATION_DATA } from '../mockSikdAllocationData';
import { APBD_COLORS, MONTHS } from '../lib/constants';

export function useAPBDData() {
  const [data, setData] = useState<APBDData[]>(() => {
    const local = localStorage.getItem('apbd_custom_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return MOCK_DATA;
      }
    }
    return MOCK_DATA;
  });

  const [sikdData, setSikdData] = useState<SikdRecord[]>(() => {
    const local = localStorage.getItem('sikd_custom_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return MOCK_SIKD_DATA;
      }
    }
    return MOCK_SIKD_DATA;
  });

  const [sikdAllocationData, setSikdAllocationData] = useState<SikdAllocationRecord[]>(() => {
    const local = localStorage.getItem('sikd_allocation_custom_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        return MOCK_SIKD_ALLOCATION_DATA;
      }
    }
    return MOCK_SIKD_ALLOCATION_DATA;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => localStorage.getItem('apbd_gas_url') || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data' | 'data-sikd' | 'alokasi-realisasi-sikd'>('pendapatan');

  // Simpan URL ke localStorage
  useEffect(() => {
    if (appsScriptUrl) {
      localStorage.setItem('apbd_gas_url', appsScriptUrl);
    }
  }, [appsScriptUrl]);

  const refreshData = async (url?: string) => {
    const targetUrl = url || appsScriptUrl;
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    try {
      const result = await APBDService.fetchData(targetUrl);
      setData(result);
      localStorage.setItem('apbd_custom_data', JSON.stringify(result));
      if (url) setAppsScriptUrl(url);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshSikdData = async (url?: string) => {
    const targetUrl = url || appsScriptUrl;
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    try {
      const result = await APBDService.fetchSIKDData(targetUrl);
      setSikdData(result);
      localStorage.setItem('sikd_custom_data', JSON.stringify(result));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const importNewData = (newData: APBDData[]) => {
    setData(newData);
    localStorage.setItem('apbd_custom_data', JSON.stringify(newData));
  };

  const importNewSikdData = (newData: SikdRecord[]) => {
    setSikdData(newData);
    localStorage.setItem('sikd_custom_data', JSON.stringify(newData));
  };

  const importNewSikdAllocationData = (newData: SikdAllocationRecord[]) => {
    setSikdAllocationData(newData);
    localStorage.setItem('sikd_allocation_custom_data', JSON.stringify(newData));
  };

  const resetToMockData = () => {
    setData(MOCK_DATA);
    localStorage.removeItem('apbd_custom_data');
  };

  const resetSikdToMockData = () => {
    setSikdData(MOCK_SIKD_DATA);
    localStorage.removeItem('sikd_custom_data');
  };

  const resetSikdAllocationToMockData = () => {
    setSikdAllocationData(MOCK_SIKD_ALLOCATION_DATA);
    localStorage.removeItem('sikd_allocation_custom_data');
  };

  const getMonthIndex = (month: string) => {
    if (!month) return -1;
    const cleanMonth = month.toLowerCase().trim();
    
    const exactIdx = MONTHS.findIndex(m => m.toLowerCase() === cleanMonth);
    if (exactIdx !== -1) return exactIdx;

    const abbreviations = [
      'jan', 'feb', 'mar', 'apr', 'mei', 'jun',
      'jul', 'agt', 'sep', 'okt', 'nov', 'des'
    ];
    
    for (let i = MONTHS.length - 1; i >= 0; i--) {
      const mLower = MONTHS[i].toLowerCase();
      const abby = abbreviations[i];
      if (cleanMonth.includes(mLower) || cleanMonth.includes(abby)) {
        return i;
      }
    }
    
    return -1;
  };

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(data.map(item => item.bulan)));
    // Sort months based on predefined order
    return ['Semua', ...months.sort((a, b) => getMonthIndex(a as string) - getMonthIndex(b as string))];
  }, [data]);

  const filteredByCategory = useMemo(() => {
    return data.filter(item => item.kategori === activeTab);
  }, [data, activeTab]);

  const trendData = useMemo(() => {
    const grouped = filteredByCategory.reduce((acc, curr) => {
      if (!acc[curr.bulan]) {
        acc[curr.bulan] = { bulan: curr.bulan, realisasi: 0, anggaran: 0 };
      }
      acc[curr.bulan].realisasi += curr.realisasi;
      acc[curr.bulan].anggaran += curr.anggaran;
      return acc;
    }, {} as Record<string, { bulan: string; realisasi: number; anggaran: number }>);

    return Object.values(grouped).sort((a: any, b: any) => getMonthIndex(a.bulan) - getMonthIndex(b.bulan));
  }, [filteredByCategory]);

  const currentViewData = useMemo(() => {
    const filtered = filteredByCategory;
    
    if (selectedMonth !== 'Semua') {
      return filtered.filter(item => item.bulan === selectedMonth);
    }

    // Aggregation for "Semua": Group by Account, take Latest Month Status
    // If a month has no data (realisasi & anggaran = 0), avoid overwriting a previous month which holds data
    const latestStatusByAccount = filtered.reduce((acc, curr) => {
      const currentMonthIndex = getMonthIndex(curr.bulan);
      const existing = acc[curr.akun];
      if (!existing) {
        acc[curr.akun] = curr;
        return acc;
      }

      const existingStatusIndex = getMonthIndex(existing.bulan);
      const currHasVal = curr.realisasi > 0 || curr.anggaran > 0;
      const existHasVal = existing.realisasi > 0 || existing.anggaran > 0;

      if (currHasVal && !existHasVal) {
        acc[curr.akun] = curr;
      } else if (!currHasVal && existHasVal) {
        // Keep existing
      } else if (currentMonthIndex > existingStatusIndex) {
        acc[curr.akun] = curr;
      }
      return acc;
    }, {} as Record<string, APBDData>);

    return Object.values(latestStatusByAccount);
  }, [filteredByCategory, selectedMonth]);

  const stats = useMemo(() => {
    return APBDService.calculateStats(currentViewData);
  }, [currentViewData]);

  const compositionData = useMemo(() => {
    // Composition should reflect the currently seen data (respecting "Semua" logic)
    // If selectedMonth is "Semua", we take the latest state of ALL categories
    let baseData = data;
    
    if (selectedMonth === 'Semua') {
      // Group all data by Account across all categories to get latest state
      const latestAll = data.reduce((acc, curr) => {
        const idx = getMonthIndex(curr.bulan);
        const key = `${curr.kategori}-${curr.akun}`;
        const existing = acc[key];
        if (!existing) {
          acc[key] = curr;
          return acc;
        }

        const existingIdx = getMonthIndex(existing.bulan);
        const currHasVal = curr.realisasi > 0 || curr.anggaran > 0;
        const existHasVal = existing.realisasi > 0 || existing.anggaran > 0;

        if (currHasVal && !existHasVal) {
          acc[key] = curr;
        } else if (!currHasVal && existHasVal) {
          // Keep existing
        } else if (idx > existingIdx) {
          acc[key] = curr;
        }
        return acc;
      }, {} as Record<string, APBDData>);
      baseData = Object.values(latestAll);
    } else {
      baseData = data.filter(item => item.bulan === selectedMonth);
    }

    const totals = baseData.reduce((acc, curr) => {
      acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.realisasi;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Pendapatan', value: totals['pendapatan'] || 0, color: APBD_COLORS.pendapatan },
      { name: 'Belanja', value: totals['belanja'] || 0, color: APBD_COLORS.belanja },
      { name: 'Pembiayaan', value: totals['pembiayaan'] || 0, color: APBD_COLORS.pembiayaan }
    ];
  }, [data, selectedMonth]);

  return {
    data,
    sikdData,
    sikdAllocationData,
    loading,
    error,
    appsScriptUrl,
    setAppsScriptUrl,
    selectedMonth,
    setSelectedMonth,
    activeTab,
    setActiveTab,
    availableMonths,
    trendData,
    currentViewData,
    stats,
    compositionData,
    refreshData,
    refreshSikdData,
    importNewData,
    importNewSikdData,
    importNewSikdAllocationData,
    resetToMockData,
    resetSikdToMockData,
    resetSikdAllocationToMockData
  };
}
