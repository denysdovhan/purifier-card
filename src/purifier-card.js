import { LitElement, html } from 'lit-element';
import { hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
import './purifier-card-editor';
import localize from './localize';
import styles from './styles';
import { version } from '../package.json';

console.info(
  `%c PURIFIER-CARD %c ${version} `,
  'color: white; background: blue; font-weight: 700;',
  'color: blue; background: white; font-weight: 700;'
);

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends customElements.get('paper-icon-button') {}
  );
}

const SUPPORT_PRESET_MODE = 8;
class PurifierCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
    };
  }

  static get styles() {
    return styles;
  }

  static async getConfigElement() {
    return document.createElement('purifier-card-editor');
  }

  static getStubConfig(hass, entities) {
    const [purifierEntity] = entities.filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === 'fan'
    );

    return {
      entity: purifierEntity || '',
    };
  }

  get platform() {
    if (this.config.platform === undefined) {
      return 'xiaomi_miio_airpurifier';
    }

    return this.config.platform;
  }

  get entity() {
    return this.hass.states[this.config.entity];
  }

  get showPresetMode() {
    if (this.config.show_preset_mode === undefined) {
      return true;
    }

    return this.config.show_preset_mode;
  }

  get showName() {
    if (this.config.show_name === undefined) {
      return true;
    }

    return this.config.show_name;
  }

  get showState() {
    if (this.config.show_state === undefined) {
      return true;
    }

    return this.config.show_state;
  }

  get showToolbar() {
    if (this.config.show_toolbar === undefined) {
      return true;
    }

    return this.config.show_toolbar;
  }

  get compactView() {
    if (this.config.compact_view === undefined) {
      return false;
    }

    return this.config.compact_view;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error(localize('error.missing_entity'));
    }

    const actions = config.actions;
    if (actions && Array.isArray(actions)) {
      console.warn(localize('warning.actions_array'));
    }

    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  speedEntityConfigured() {
    return (
      this.config.speed !== undefined &&
      this.config.speed.entity_id !== undefined
    );
  }

  shouldUpdate(changedProps) {
    if (hasConfigOrEntityChanged(this, changedProps)) {
      return true;
    }

    if (this.speedEntityConfigured()) {
      const oldHass = changedProps.get('hass');
      if (oldHass) {
        return (
          oldHass.states[this.config.speed.entity_id] !==
          this.hass.states[this.config.speed.entity_id]
        );
      }
    }

    return false;
  }

  updated(changedProps) {
    const oldHass = changedProps.get('hass');
    if (!oldHass) {
      return;
    }

    if (
      oldHass.states[this.config.entity] !==
      this.hass.states[this.config.entity]
    ) {
      this.requestInProgress = false;
      return;
    }

    if (
      this.speedEntityConfigured() &&
      oldHass.states[this.config.speed.entity_id] !==
        this.hass.states[this.config.speed.entity_id]
    ) {
      this.requestInProgress = false;
    }
  }

  handleMore() {
    fireEvent(
      this,
      'hass-more-info',
      {
        entityId: this.entity.entity_id,
      },
      {
        bubbles: true,
        composed: true,
      }
    );
  }

  handlePresetMode(e) {
    const preset_mode = e.target.getAttribute('value');
    this.callService('fan.set_preset_mode', { preset_mode });
  }

  handlePercentage(e) {
    this.setPercentage(e.detail.value);
  }

  setPercentage(percentage) {
    if (this.speedEntityConfigured()) {
      const { entity_id } = this.config.speed;
      const {
        attributes: { min, max, step },
      } = this.hass.states[entity_id];
      const value =
        Math.round((percentage * (max - min) * 0.01 + min) / step) * step;
      this.callService('number.set_value', { entity_id, value });
      return;
    }

    this.callService('fan.set_percentage', { percentage });
  }

  callService(service, options = {}, isRequest = true) {
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, {
      entity_id: this.config.entity,
      ...options,
    });

    if (isRequest) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  getPercentageFromRPM() {
    if (!this.speedEntityConfigured()) return undefined;

    let rpm_state;
    if (
      this.entity.attributes.preset_mode != 'Favorite' &&
      this.config.speed.sensor_entity_id !== undefined
    )
      rpm_state = this.hass.states[this.config.speed.sensor_entity_id].state;
    else rpm_state = this.hass.states[this.config.speed.entity_id].state;

    const {
      attributes: { min, max },
    } = this.hass.states[this.config.speed.entity_id];
    return ((rpm_state - min) / (max - min)) * 100;
  }

  renderPresetMode() {
    const {
      attributes: { preset_mode, preset_modes, supported_features },
    } = this.entity;

    if (
      !this.showPresetMode ||
      !preset_modes ||
      !(supported_features & SUPPORT_PRESET_MODE)
    ) {
      return html``;
    }

    const selected = preset_modes.indexOf(preset_mode);

    return html`
      <ha-button-menu @click="${(e) => e.stopPropagation()}">
        <mmp-icon-button slot="trigger">
          <ha-icon icon="mdi:fan"></ha-icon>
          <span>
            ${localize(`preset_mode.${preset_mode}`) || preset_mode}
          </span>
        </mmp-icon-button>

        ${preset_modes.map(
          (item, index) =>
            html`<mwc-list-item
              ?activated=${selected === index}
              value=${item}
              @click=${(e) => this.handlePresetMode(e)}
            >
              ${localize(`preset_mode.${item}`) || item}
            </mwc-list-item>`
        )}
      </ha-button-menu>
    `;
  }

  renderAQI() {
    const { aqi = {} } = this.config;
    const { entity_id, attribute = 'aqi', unit = 'AQI' } = aqi;

    const value = entity_id
      ? this.hass.states[entity_id].state
      : this.entity.attributes[attribute];

    let prefix = '';

    if (value < 10) {
      prefix = html`<span class="number-off">00</span>`;
    } else if (value < 100) {
      prefix = html`<span class="number-off">0</span>`;
    }

    return html`
      <div class="current-aqi">
        ${prefix}<span class="number-on">${value}</span>
        <sup>${unit}</sup>
      </div>
    `;
  }

  renderSlider() {
    const { state } = this.entity;

    let percentage, percentage_step;
    if (this.speedEntityConfigured()) {
      const {
        attributes: { min, max, step },
      } = this.hass.states[this.config.speed.entity_id];
      percentage = Math.round(this.getPercentageFromRPM());
      percentage_step = ((max - min) / step) * 0.01;
    } else {
      percentage = this.entity.percentage;
      percentage_step = this.entity.percentage_step;
    }

    const disabled = state !== 'on';
    const stateClass = !disabled ? 'working' : 'standby';

    const sliderHtml = html` <round-slider
      value=${percentage}
      step=${percentage_step}
      ?disabled="${disabled}"
      @value-changed=${(e) => this.handlePercentage(e)}
    >
    </round-slider>`;

    const sliderValueHtml = html` <div class="slider-value">
      ${percentage}%
    </div>`;

    return html`
      <div class="slider">
        ${percentage !== undefined ? sliderHtml : ''}
        <div class="slider-center image ${stateClass}">
          <div class="slider-content">
            ${this.renderAQI()}
          </div>
          ${percentage !== undefined ? sliderValueHtml : ''}
        </div>
      </div>
    `;
  }

  renderControls() {
    return this.compactView ? this.renderAQI() : this.renderSlider();
  }

  renderName() {
    const {
      attributes: { friendly_name },
    } = this.entity;

    if (!this.showName) {
      return html``;
    }

    return html` <div class="friendly-name">${friendly_name}</div> `;
  }

  renderState() {
    const { state } = this.entity;
    const localizedState = localize(`state.${state}`) || state;

    if (!this.showState) {
      return html``;
    }

    return html`
      <div class="state">
        <span class="state-text" alt=${localizedState}>
          ${localizedState}
        </span>
        <ha-circular-progress
          .active=${this.requestInProgress}
          size="small"
        ></ha-circular-progress>
      </div>
    `;
  }

  renderStats() {
    const { stats = [] } = this.config;

    const statsList = stats || [];

    return statsList.map(({ entity_id, attribute, unit, subtitle }) => {
      if (!entity_id && !attribute) {
        return html``;
      }

      const value = entity_id
        ? this.hass.states[entity_id].state
        : this.entity.attributes[attribute];

      return html`
        <div class="stats-block">
          <span class="stats-value">${value}</span>
          ${unit}
          <div class="stats-subtitle">${subtitle}</div>
        </div>
      `;
    });
  }

  renderToolbar() {
    const { shortcuts = [] } = this.config;
    const { state, attributes } = this.entity;

    if (!this.showToolbar) {
      return html``;
    }

    const buttons = shortcuts.map(
      ({ name, icon, service, service_data, preset_mode, percentage }) => {
        const execute = () => {
          if (service) {
            this.callService(service, service_data);
          }

          if (preset_mode) {
            this.callService('fan.set_preset_mode', { preset_mode });
          }

          if (percentage) {
            this.setPercentage(percentage);
          }
        };

        const isActive =
          service ||
          percentage ===
            (attributes.percentage !== undefined
              ? attributes.percentage
              : this.getPercentageFromRPM()) ||
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
      }
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

  render() {
    if (!this.entity) {
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

    return html`
      <ha-card>
        <div class="preview">
          <div class="header">
            <div class="preset-mode">
              ${this.renderPresetMode()}
            </div>
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

          <div class="stats">${this.renderStats()}</div>
        </div>

        ${this.renderToolbar()}
      </ha-card>
    `;
  }
}

customElements.define('purifier-card', PurifierCard);

window.customCards = window.customCards || [];
window.customCards.push({
  preview: true,
  type: 'purifier-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
