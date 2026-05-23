export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatBillions = (value: number) => {
  return formatCurrency(value);
};

export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + '%';
};

export const safeParseNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = val.toString().trim();
  
  // Remove "Rp" or "Rp." prefixes in a case-insensitive way
  str = str.replace(/^[Rr][Pp]\.?\s*/g, '');
  
  // Clean from anything other than digits, dots, commas, and hyphens (minus sign)
  str = str.replace(/[^0-9.,-]/g, '').trim();
  if (!str || str === '-') return 0;
  
  // If we have both dots and commas, e.g. "1.084.270.000,50"
  if (str.includes('.') && str.includes(',')) {
    // If dot comes before comma, e.g. "1.234,56", dots are thousands and comma is decimal
    if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // If comma comes before dot, e.g. "1,234.56"
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Has commas but no dots
    const parts = str.split(',');
    if (parts.length === 2) {
      // If the integer part has more than 3 digits, the comma MUST be a decimal point (e.g. "125000,50")
      if (parts[0].length > 3) {
        str = str.replace(',', '.');
      } else if (parts[1].length < 3) {
        str = str.replace(',', '.');
      } else {
        str = str.replace(/,/g, '');
      }
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    // Has dots but no commas.
    const parts = str.split('.');
    if (parts.length === 2) {
      if (parts[0].length > 3) {
        // Keep dot as decimal separator (e.g., "125000.50" or "62500000000.500")
      } else if (parts[1].length === 3) {
        // Single dot followed by exactly 3 digits, e.g. "159.000" -> thousands separator
        str = str.replace(/\./g, '');
      }
    } else if (parts.length > 2) {
      // Multiple dots, e.g. "1.084.270.000" -> thousands separator
      str = str.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};
