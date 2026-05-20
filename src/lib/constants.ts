import { logoB64 } from '../assets/logo-b64';
import heroKenawa from '../assets/images/sumbawa_barat_kenawa_hero_1779259194797.png';
import malukBeach from '../assets/images/sumbawa_maluk_beach_1779260638751.png';
import sunsetHills from '../assets/images/sumbawa_sunset_hills_1779260660805.png';
import ammanMineral from '../assets/images/amman_mineral_ksb_1779260983585.png';
import grahaFitrah from '../assets/images/graha_fitrah_ksb_authentic_1779261355750.png';
import masjidDarussalam from '../assets/images/masjid_darussalam_ksb_authentic_1779261376754.png';

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
  LOGO_PATH: logoB64,
  HERO_PATH: heroKenawa,
  HERO_IMAGES: [
    {
      src: heroKenawa,
      alt: 'Pulau Kenawa, Sumbawa Barat',
      shortName: 'P. Kenawa'
    },
    {
      src: malukBeach,
      alt: 'Pantai Maluk, Sumbawa Barat',
      shortName: 'Pantai Maluk'
    },
    {
      src: sunsetHills,
      alt: 'Sunset Bukit & Selat Sumbawa Barat',
      shortName: 'Selat Sumbawa'
    },
    {
      src: ammanMineral,
      alt: 'PT Amman Mineral Batu Hijau, Sumbawa Barat',
      shortName: 'Amman Mineral'
    },
    {
      src: grahaFitrah,
      alt: 'Gedung Graha Fitrah, Kompleks KTC Sumbawa Barat',
      shortName: 'Graha Fitrah'
    },
    {
      src: masjidDarussalam,
      alt: 'Masjid Agung Darussalam, Kompleks KTC Sumbawa Barat',
      shortName: 'Masjid Darussalam'
    }
  ]
};
