import { PurifierCardConfig } from './types';
import localize from './localize';

export default function buildConfig(
  config?: Partial<PurifierCardConfig>,
): PurifierCardConfig {
  if (!config) {
    throw new Error(localize('error.invalid_config'));
  }

  if (!config.entity) {
    throw new Error(localize('error.missing_entity'));
  }

  return {
    ...config, // pass all unlisted properties
    entity: config.entity,
    show_name: config.show_name ?? true,
    show_state: config.show_state ?? true,
    show_preset_mode: config.show_preset_mode ?? true,
    show_toolbar: config.show_toolbar ?? true,
    compact_view: config.compact_view ?? false,
    aqi: config.aqi ?? {},
    stats: config.stats ?? [],
    shortcuts: config.shortcuts ?? [],
  };
}
