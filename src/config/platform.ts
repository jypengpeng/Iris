/**
 * 平台配置解析
 */

import { PlatformConfig } from './types';

export function parsePlatformConfig(raw: any = {}): PlatformConfig {
  return {
    type: (raw.type ?? 'console') as PlatformConfig['type'],
    discord: { token: raw.discord?.token ?? '' },
    telegram: { token: raw.telegram?.token ?? '' },
  };
}
