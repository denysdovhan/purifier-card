import {
  HassEntityAttributeBase,
  HassEntityBase,
  HassServiceTarget,
} from 'home-assistant-js-websocket';
import { TemplateResult, nothing } from 'lit';

export * from 'home-assistant-js-websocket';

export type TemplateNothing = typeof nothing;
export type Template = TemplateResult | TemplateNothing;

export type PurifierEntityState = 'on' | 'off' | 'unavailable' | 'unknown';

export interface PurifierEntityAttributes extends HassEntityAttributeBase {
  preset_mode?: string;
  preset_modes?: string[];
  percentage?: number;
  percentage_step?: number;
  supported_features?: number;
  use_time?: number;
}

export interface PurifierEntity extends HassEntityBase {
  attributes: PurifierEntityAttributes;
  state: PurifierEntityState;
}

export interface PurifierAQI {
  entity_id?: string;
  attribute?: string;
  unit?: string;
}

export interface PurifierCardStat {
  entity_id?: string;
  attribute?: string;
  value_template?: string;
  unit?: string;
  subtitle?: string;
}

export interface PurifierCardShortcut {
  name?: string;
  icon?: string;
  service?: string;
  service_data?: Record<string, unknown>;
  target?: HassServiceTarget;
  percentage?: number;
  preset_mode?: string;
}

export interface PurifierCardConfig {
  entity: string;
  show_name: boolean;
  show_state: boolean;
  show_preset_mode: boolean;
  show_toolbar: boolean;
  compact_view: boolean;
  aqi: PurifierAQI;
  stats: PurifierCardStat[];
  shortcuts: PurifierCardShortcut[];
}

export interface SliderValue {
  value: number;
}
