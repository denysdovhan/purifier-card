import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  HomeAssistant,
  LovelaceCardConfig,
  fireEvent,
} from 'custom-card-helpers';
import { PurifierCardConfig, Template } from './types';
import localize from './localize';
import styles from './editor.css';

type ConfigElement = HTMLInputElement & {
  configValue?: keyof PurifierCardConfig;
};

@customElement('purifier-card-editor')
export class PurifierCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config!: Partial<PurifierCardConfig>;

  @state() private compact_view = false;
  @state() private show_name = true;
  @state() private show_state = true;
  @state() private show_toolbar = true;

  public setConfig(config: LovelaceCardConfig & PurifierCardConfig) {
    this.config = config;

    if (!this.config.entity) {
      this.config.entity = this.getEntitiesByType('fan')[0] || '';
      fireEvent(this, 'config-changed', { config: this.config });
    }
  }

  private getEntitiesByType(type: string): string[] {
    if (!this.hass) {
      return [];
    }

    return Object.keys(this.hass.states).filter((eid) => eid.startsWith(type));
  }

  protected render(): Template {
    if (!this.hass) {
      return nothing;
    }

    const fanEntities = this.getEntitiesByType('fan');

    return html`
      <div class="card-config">
        <div class="option">
          <ha-select
            .label=${localize('editor.entity')}
            @selected=${this.valueChanged}
            .configValue=${'entity'}
            .value=${this.config.entity}
            @closed=${(e: PointerEvent) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
            required
            validationMessage=${localize('error.missing_entity')}
          >
            ${fanEntities.map(
              (entity) =>
                html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`,
            )}
          </ha-select>
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.compact_view
                ? 'editor.compact_view_aria_label_off'
                : 'editor.compact_view_aria_label_on',
            )}
            .checked=${this.compact_view}
            .configValue=${'compact_view'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.compact_view')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on',
            )}
            .checked=${this.show_name}
            .configValue=${'show_name'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_state
                ? 'editor.show_state_aria_label_off'
                : 'editor.show_state_aria_label_on',
            )}
            .checked=${this.show_state}
            .configValue=${'show_state'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_state')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_name
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on',
            )}
            .checked=${this.show_toolbar}
            .configValue=${'show_toolbar'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
        </div>

        <strong> ${localize('editor.code_only_note')}</strong>
      </div>
    `;
  }

  private valueChanged(event: Event): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }
    const target = event.target as ConfigElement;
    if (
      !target.configValue ||
      this.config[target.configValue] === target?.value
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
