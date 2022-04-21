import { LitElement, html, nothing } from 'lit';
import { hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import localize from './localize';
import styles from './styles.css';
import { version } from '../package.json';
import workingImg from './images/purifier-working.gif';
import standbyImg from './images/purifier-standby.png';
import './purifier-card-editor';

registerTemplates();

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

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  updated(changedProps) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity] !==
        this.hass.states[this.config.entity]
    ) {
      this.requestInProgress = false;
    }
  }

  handleMore(entityId = this.entity.entity_id) {
    fireEvent(
      this,
      'hass-more-info',
      {
        entityId,
      },
      {
        bubbles: false,
        composed: true,
      }
    );
  }

  handlePresetMode(e) {
    const preset_mode = e.target.getAttribute('value');
    this.callService('fan.set_preset_mode', { preset_mode });
  }

  handlePercentage(e) {
    const percentage = e.detail.value;
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

  renderPresetMode() {
    const {
      attributes: { preset_mode, preset_modes, supported_features },
    } = this.entity;

    if (
      !this.showPresetMode ||
      !preset_modes ||
      !(supported_features & SUPPORT_PRESET_MODE)
    ) {
      return nothing;
    }

    const selected = preset_modes.indexOf(preset_mode);

    return html`
      <div class="preset-mode">
        <ha-button-menu @click="${(e) => e.stopPropagation()}">
          <mmp-icon-button slot="trigger">
            <ha-icon icon="mdi:fan"></ha-icon>
            <span>
              ${localize(`preset_mode.${preset_mode}`) || preset_mode}
            </span>
          </mmp-icon-button>

          ${preset_modes.map(
            (item, index) =>
              html`
                <mwc-list-item
                  ?activated=${selected === index}
                  value=${item}
                  @click=${(e) => this.handlePresetMode(e)}
                >
                  ${localize(`preset_mode.${item}`) || item}
                </mwc-list-item>
              `
          )}
        </ha-button-menu>
      </div>
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
          @value-changed=${(e) => this.handlePercentage(e)}
        >
        </round-slider>
        <img src=${image} alt="purifier is ${state}" class="image" />
        <div class="slider-center">
          <div class="slider-content">
            ${this.renderAQI()}
          </div>
          <div class="slider-value">
            ${percentage ? `${percentage}%` : nothing}
          </div>
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
      return nothing;
    }

    return html` <div class="friendly-name">${friendly_name}</div> `;
  }

  renderState() {
    const { state } = this.entity;
    const localizedState = localize(`state.${state}`) || state;

    if (!this.showState) {
      return nothing;
    }

    return html`
      <div class="state">
        <span class="state-text" alt=${localizedState}>
          ${localizedState}
        </span>
        <mwc-circular-progress
          .indeterminate=${this.requestInProgress}
          density="-5"
        ></mwc-circular-progress>
      </div>
    `;
  }

  renderStats() {
    const { stats = [] } = this.config;

    const statsList = stats || [];

    return statsList.map(
      ({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute && !value_template) {
          return nothing;
        }

        const state = entity_id
          ? this.hass.states[entity_id].state
          : this.entity.attributes[attribute];

        const value = html`
          <ha-template
            hass=${this.hass}
            template=${value_template}
            value=${state}
            variables=${{ value: state }}
          ></ha-template>
        `;

        return html`
          <div class="stats-block" @click="${() => this.handleMore(entity_id)}">
            <span class="stats-value">${value}</span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      }
    );
  }

  renderToolbar() {
    const { shortcuts = [] } = this.config;
    const { state, attributes } = this.entity;

    if (!this.showToolbar) {
      return nothing;
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
            <div class="tips">
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
