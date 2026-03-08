export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

export const LATAM_CURRENCIES: CurrencyConfig[] = [
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', locale: 'es-PE' },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', locale: 'en-US' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', locale: 'es-MX' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', locale: 'es-CO' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', locale: 'es-AR' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', locale: 'es-CL' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', locale: 'pt-BR' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs', locale: 'es-BO' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$U', locale: 'es-UY' },
  { code: 'PYG', name: 'Guaraní paraguayo', symbol: '₲', locale: 'es-PY' },
  { code: 'GTQ', name: 'Quetzal guatemalteco', symbol: 'Q', locale: 'es-GT' },
  { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', locale: 'es-DO' },
];

export function getCurrencyConfig(code: string): CurrencyConfig {
  return LATAM_CURRENCIES.find(c => c.code === code) || LATAM_CURRENCIES[0];
}

export function formatCurrency(value: number, currencyCode: string = 'PEN'): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(value);
}

export function getCurrencySymbol(currencyCode: string = 'PEN'): string {
  return getCurrencyConfig(currencyCode).symbol;
}
