import fs from 'fs';
import path from 'path';

export type CityConfig = {
  version: string;
  city: any;
  geographic: any;
  features: any;
  integrations: any;
  localization: any;
  customFields?: any;
};

let cached: CityConfig | null = null;

export function loadCityConfig(): CityConfig {
  if (cached) return cached;
  const file = path.join(process.cwd(), 'config', 'madison.json');
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    cached = JSON.parse(raw);
    return cached!;
  } catch (e) {
    console.warn('City config not found or invalid at config/madison.json');
    cached = {
      version: '0',
      city: { name: process.env.CITY_NAME ?? 'madison' },
      geographic: {},
      features: {},
      integrations: {},
      localization: { defaultLanguage: 'en' },
      customFields: {},
    } as CityConfig;
    return cached;
  }
}

export default loadCityConfig;

