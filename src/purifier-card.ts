import { CSSResultGroup, LitElement, PropertyValues, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  hasConfigOrEntityChanged,
  fireEvent,
  HomeAssistant,
  ServiceCallRequest,
} from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import get from 'lodash/get';
import localize from './localize';
import styles from './styles.css';
import workingImg from './images/purifier-working.gif';
import standbyImg from './images/purifier-standby.png';

import {
  PurifierCardConfig,
  PurifierEntity,
  SliderValue,
  Template,
} from './types';
import buildConfig from './config';

registerTemplates();

// String on the right side will be replaced by Rollup
const PKG_VERSION = 'PKG_VERSION_VALUE';

console.info(
  `%c PURIFIER-CARD %c ${PKG_VERSION} `,
  'color: white; background: blue; font-weight: 700;',
  'color: blue; background: white; font-weight: 700;',
);

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends (customElements.get('paper-icon-button') ?? HTMLElement) {},
  );
}

const SUPPORT_PRESET_MODE = 8;
@customElement('purifier-card')
export class PurifierCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: PurifierCardConfig;
  @state() private requestInProgress = false;

  public static get styles(): CSSResultGroup {
    return styles;
  }

  public static async getConfigElement() {
    import('./editor');
    return document.createElement('purifier-card-editor');
  }

  public static getStubConfig(
    _: unknown,
    entities: string[],
  ): Partial<PurifierCardConfig> {
    const [purifierEntity] = entities.filter((eid) => eid.startsWith('fan'));

    return {
      entity: purifierEntity ?? '',
    };
  }

  public setConfig(config: Partial<PurifierCardConfig>) {
    this.config = buildConfig(config);
  }

  get entity(): PurifierEntity {
    return this.hass.states[this.config.entity] as PurifierEntity;
  }

  public getCardSize() {
    return 2;
  }

  protected shouldUpdate(changedProps: PropertyValues) {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected updated(changedProps: PropertyValues) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity] !==
        this.hass.states[this.config.entity]
    ) {
      this.requestInProgress = false;
    }
  }

  private handleMore(entityId: string = this.entity.entity_id) {
    fireEvent(
      this,
      'hass-more-info',
      {
        entityId,
      },
      {
        bubbles: false,
        composed: true,
      },
    );
  }

  private callService(
    service: ServiceCallRequest['service'],
    options: ServiceCallRequest['serviceData'] = {},
    target?: ServiceCallRequest['target'],
    request = true,
  ) {
    const [domain, name] = service.split('.');
    this.hass.callService(
      domain,
      name,
      {
        entity_id: this.config.entity,
        ...options,
      },
      target,
    );

    if (request) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  private handlePresetMode(event: PointerEvent) {
    const preset_mode = (<HTMLDivElement>event.target).getAttribute('value');
    this.callService('fan.set_preset_mode', { preset_mode });
  }

  private handlePercentage(event: CustomEvent<SliderValue>) {
    const percentage = event.detail.value;
    this.callService('fan.set_percentage', { percentage });
  }

  private renderPresetMode(): Template {
    const {
      attributes: { preset_mode, preset_modes, supported_features = 0 },
    } = this.entity;

    if (
      !preset_mode ||
      !this.config.show_preset_mode ||
      !preset_modes ||
      !(supported_features & SUPPORT_PRESET_MODE)
    ) {
      return nothing;
    }

    const selected = preset_modes.indexOf(preset_mode);

    return html`
      <div class="preset-mode">
        <ha-button-menu @click="${(e: PointerEvent) => e.stopPropagation()}">
          <mmp-icon-button slot="trigger">
            <ha-icon icon="mdi:fan"></ha-icon>
            <span>
              ${localize(`preset_mode.${preset_mode}`) || preset_mode}
            </span>
          </mmp-icon-button>

          ${preset_modes.map(
            (item, index) => html`
              <mwc-list-item
                ?activated=${selected === index}
                value=${item}
                @click=${(e: PointerEvent) => this.handlePresetMode(e)}
              >
                ${localize(`preset_mode.${item.toLowerCase()}`) || item}
              </mwc-list-item>
            `,
          )}
        </ha-button-menu>
      </div>
    `;
  }

  private renderAQI(): Template {
    const { aqi = {} } = this.config;
    const { entity_id, attribute, unit = 'AQI' } = aqi;

    let value = '';

    if (entity_id && attribute) {
      value = get(this.hass.states[entity_id].attributes, attribute);
    } else if (attribute) {
      value = get(this.entity.attributes, attribute);
    } else if (entity_id) {
      value = this.hass.states[entity_id].state;
    } else {
      return nothing;
    }

    let prefix: Template = nothing;
    const numericValue = Number(value);

    if (numericValue < 10) {
      prefix = html`<span class="number-off">00</span>`;
    } else if (numericValue < 100) {
      prefix = html`<span class="number-off">0</span>`;
    }

    return html`
      <div class="current-aqi">
        ${prefix}<span class="number-on">${value}</span>
        <sup>${unit}</sup>
      </div>
    `;
  }

  private renderSlider(): Template {
    const {
      state,
      attributes: { percentage, percentage_step },
    } = this.entity;

    const disabled = state !== 'on';
    const image = !disabled ? workingImg : standbyImg;

    return html`
      <div class="slider">
        <round-slider
          value=${percentage}
          step=${percentage_step}
          ?disabled="${disabled}"
          @value-changed=${(e: CustomEvent<SliderValue>) =>
            this.handlePercentage(e)}
        >
        </round-slider>
        <img src=${image} alt="purifier is ${state}" class="image" />
        <div class="slider-center">
          <div class="slider-content">${this.renderAQI()}</div>
          <div class="slider-value">
            ${percentage ? `${percentage}%` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private renderControls(): Template {
    return this.config.compact_view ? this.renderAQI() : this.renderSlider();
  }

  private renderName(): Template {
    const {
      attributes: { friendly_name },
    } = this.entity;

    if (!this.config.show_name) {
      return nothing;
    }

    return html` <div class="friendly-name">${friendly_name}</div> `;
  }

  private renderState(): Template {
    const { state } = this.entity;
    const localizedState = localize(`state.${state}`) || state;

    if (!this.config.show_state) {
      return nothing;
    }

    return html`
      <div class="state">
        <span class="state-text" alt=${localizedState}>
          ${localizedState}
        </span>
        <ha-circular-progress
          .indeterminate=${this.requestInProgress}
          size="small"
        ></ha-circular-progress>
      </div>
    `;
  }

  private renderStats(): Template {
    const statsList = this.config.stats || [];

    const stats = statsList.map(
      ({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute) {
          return nothing;
        }

        let state = '';

        if (entity_id && attribute) {
          state = get(this.hass.states[entity_id].attributes, attribute);
        } else if (attribute) {
          state = get(this.entity.attributes, attribute);
        } else if (entity_id) {
          state = this.hass.states[entity_id]?.state;
        } else {
          return nothing;
        }

        const value = state
          ? html`
              <ha-template
                hass=${this.hass}
                template=${value_template}
                value=${state}
                variables=${{ value: state }}
              ></ha-template>
            `
          : nothing;

        return html`
          <div class="stats-block" @click="${() => this.handleMore(entity_id)}">
            <span class="stats-value">${value}</span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      },
    );

    return stats.length ? html`<div class="stats">${stats}</div>` : nothing;
  }

  private renderToolbar(): Template {
    const { shortcuts = [] } = this.config;
    const { state, attributes } = this.entity;

    if (!this.config.show_toolbar) {
      return nothing;
    }

    const buttons = shortcuts.map(
      ({
        name,
        icon,
        service,
        service_data,
        target,
        preset_mode,
        percentage,
      }) => {
        const execute = () => {
          if (service) {
            this.callService(service, target, service_data);
          }

          if (preset_mode) {
            this.callService('fan.set_preset_mode', { preset_mode });
          }

          if (percentage) {
            this.callService('fan.set_percentage', { percentage });
          }
        };

        const isActive =
          service ||
          percentage === attributes.percentage ||
          preset_mode === attributes.preset_mode;

        const className = isActive ? 'active' : '';

        return html`
          <ha-icon-button
            icon="${icon}"
            title="${name}"
            class="${className}"
            @click="${execute}"
            ><ha-icon icon="${icon}"></ha-icon
          ></ha-icon-button>
        `;
      },
    );

    return html`
      <div class="toolbar">
        <ha-icon-button
          icon="hass:power"
          class="${state === 'on' ? 'active' : ''}"
          title="${localize('common.toggle_power')}"
          @click="${() => this.callService('fan.toggle')}"
          ><ha-icon icon="hass:power"></ha-icon>
        </ha-icon-button>

        <div class="fill-gap"></div>

        ${buttons}
      </div>
    `;
  }

  private renderUnavailable(): Template {
    return html`
      <ha-card>
        <div class="preview not-available">
          <div class="metadata">
            <div class="not-available">
              ${localize('common.not_available')}
            </div>
          <div>
        </div>
      </ha-card>
    `;
  }

  protected render() {
    if (!this.entity) {
      return this.renderUnavailable();
    }

    return html`
      <ha-card>
        <div class="preview">
          <div class="header">
            <div class="tips">${this.renderPresetMode()}</div>
            <ha-icon-button
              class="more-info"
              icon="mdi:dots-vertical"
              ?more-info="true"
              @click="${() => this.handleMore()}"
              ><ha-icon icon="mdi:dots-vertical"></ha-icon
            ></ha-icon-button>
          </div>

          <div class="controls">${this.renderControls()}</div>

          <div class="metadata">${this.renderName()} ${this.renderState()}</div>

          ${this.renderStats()}
        </div>

        ${this.renderToolbar()}
      </ha-card>
    `;
  }
}

declare global {
  interface Window {
    customCards?: unknown[];
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  preview: true,
  type: 'purifier-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
