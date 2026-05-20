import { useState, useMemo, useEffect } from 'react';
import { APBDData, SikdRecord } from '../types';
import { APBDService } from '../services/apbdService';
import { MOCK_DATA } from '../mockData';
import { MOCK_SIKD_DATA } from '../mockSikdData';
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => localStorage.getItem('apbd_gas_url') || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'pendapatan' | 'belanja' | 'pembiayaan' | 'tambah-data' | 'data-sikd'>('pendapatan');

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

  const resetToMockData = () => {
    setData(MOCK_DATA);
    localStorage.removeItem('apbd_custom_data');
  };

  const resetSikdToMockData = () => {
    setSikdData(MOCK_SIKD_DATA);
    localStorage.removeItem('sikd_custom_data');
  };

  const getMonthIndex = (month: string) => {
    return MONTHS.findIndex(m => m.toLowerCase() === (month || '').toLowerCase());
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
    const latestStatusByAccount = filtered.reduce((acc, curr) => {
      const currentMonthIndex = getMonthIndex(curr.bulan);
      const existingStatusIndex = acc[curr.akun] ? getMonthIndex(acc[curr.akun].bulan) : -Infinity;

      if (currentMonthIndex > existingStatusIndex) {
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
        if (!acc[key] || idx > getMonthIndex(acc[key].bulan)) {
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
    ].filter(item => item.value > 0);
  }, [data, selectedMonth]);

  return {
    data,
    sikdData,
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
    resetToMockData,
    resetSikdToMockData
  };
}
