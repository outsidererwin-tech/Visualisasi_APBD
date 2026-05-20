export const APBD_COLORS = {
  pendapatan: '#6366f1',
  belanja: '#10b981',
  pembiayaan: '#f59e0b',
  accent: '#3B82F6',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const TABS = [
  { id: 'pendapatan', label: 'Pendapatan' },
  { id: 'belanja', label: 'Belanja' },
  { id: 'pembiayaan', label: 'Pembiayaan' },
] as const;

export const APP_CONFIG = {
  DAERAH_NAME: 'Kab. Sumbawa Barat',
  LOGO_PATH: '/src/assets/images/logo_ksb_png_1779190186270.png',
  HERO_PATH: '/src/assets/images/sumbawa_barat_kenawa_hero_1779259194797.png',
  HERO_IMAGES: [
    {
      src: '/src/assets/images/sumbawa_barat_kenawa_hero_1779259194797.png',
      alt: 'Pulau Kenawa, Sumbawa Barat',
      shortName: 'P. Kenawa'
    },
    {
      src: '/src/assets/images/sumbawa_maluk_beach_1779260638751.png',
      alt: 'Pantai Maluk, Sumbawa Barat',
      shortName: 'Pantai Maluk'
    },
    {
      src: '/src/assets/images/sumbawa_sunset_hills_1779260660805.png',
      alt: 'Sunset Bukit & Selat Sumbawa Barat',
      shortName: 'Selat Sumbawa'
    },
    {
      src: '/src/assets/images/amman_mineral_ksb_1779260983585.png',
      alt: 'PT Amman Mineral Batu Hijau, Sumbawa Barat',
      shortName: 'Amman Mineral'
    },
    {
      src: '/src/assets/images/graha_fitrah_ksb_authentic_1779261355750.png',
      alt: 'Gedung Graha Fitrah, Kompleks KTC Sumbawa Barat',
      shortName: 'Graha Fitrah'
    },
    {
      src: '/src/assets/images/masjid_darussalam_ksb_authentic_1779261376754.png',
      alt: 'Masjid Agung Darussalam, Kompleks KTC Sumbawa Barat',
      shortName: 'Masjid Darussalam'
    }
  ]
};
