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

const SUPPORT_SET_SPEED = 1;
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
      return 'xiaomi_miio';
    }

    return this.config.platform;
  }

  get entity() {
    return this.hass.states[this.config.entity];
  }

  get showSpeed() {
    if (this.config.show_speed === undefined) {
      return false;
    }

    return this.config.show_speed;
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

  handleSpeed(e) {
    const speed = e.target.getAttribute('value');
    this.callService('fan.set_speed', { speed });
  }

  handlePresetMode(e) {
    const preset_mode = e.target.getAttribute('value');
    this.callService('fan.set_preset_mode', { preset_mode });
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

  renderSpeed() {
    const {
      attributes: { speed, speed_list, supported_features },
    } = this.entity;

    // TODO handle percentages
    if (
      !this.showSpeed ||
      !speed_list ||
      !(supported_features & SUPPORT_SET_SPEED)
    ) {
      return html``;
    }

    const selected = speed_list.indexOf(speed);

    return html`
      <div class="speed>
        <paper-menu-button
          slot="dropdown-trigger"
          .horizontalAlign=${'right'}
          .verticalAlign=${'top'}
          .verticalOffset=${40}
          .noAnimations=${true}
          @click="${(e) => e.stopPropagation()}"
        >
          <paper-button slot="dropdown-trigger">
            <ha-icon icon="mdi:fan"></ha-icon>
            <span show=${true}> ${localize(`speed.${speed}`) || speed} </span>
          </paper-button>
          <paper-listbox
            slot="dropdown-content"
            selected=${selected}
            @click="${(e) => this.handleSpeed(e)}"
          >
            ${speed_list.map(
              (item) =>
                html`<paper-item value=${item}
                  >${localize(`speed.${item}`) || item}</paper-item
                >`
            )}
          </paper-listbox>
        </paper-menu-button>
      </div>
    `;
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
      <div class="preset-mode">
        <paper-menu-button
          slot="dropdown-trigger"
          .horizontalAlign=${'right'}
          .verticalAlign=${'top'}
          .verticalOffset=${40}
          .noAnimations=${true}
          @click="${(e) => e.stopPropagation()}"
        >
          <paper-button slot="dropdown-trigger">
            <ha-icon icon="mdi:fan"></ha-icon>
            <span show=${true}
              >${localize(`preset_mode.${preset_mode}`) || preset_mode}
            </span>
          </paper-button>
          <paper-listbox
            slot="dropdown-content"
            selected=${selected}
            @click="${(e) => this.handlePresetMode(e)}"
          >
            ${preset_modes.map(
              (item) =>
                html`<paper-item value=${item}
                  >${localize(`preset_mode.${item}`) || item}</paper-item
                >`
            )}
          </paper-listbox>
        </paper-menu-button>
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
      ({
        name,
        icon,
        service,
        service_data,
        preset_mode,
        percentage,
        xiaomi_miio_favorite_level,
      }) => {
        const execute = () => {
          if (service) {
            this.callService(service, service_data);
          }

          if (preset_mode) {
            this.callService('fan.set_preset_mode', { preset_mode });
          }

          if (preset_mode && xiaomi_miio_favorite_level) {
            setTimeout(() => {
              this.callService(this.platform + '.fan_set_favorite_level', {
                level: xiaomi_miio_favorite_level,
              });
            }, 500);
          }

          if (!preset_mode && xiaomi_miio_favorite_level) {
            throw new Error(
              localize('error.xiaomi_miio_level_without_preset_mode')
            );
          }

          if (percentage) {
            this.callService('fan.set_percentage', { percentage });
          }
        };

        const isActive =
          service ||
          percentage === attributes.percentage ||
          preset_mode === attributes.preset_mode ||
          // preset_mode with specific favorite level
          (preset_mode === attributes.preset_mode &&
            xiaomi_miio_favorite_level === attributes.favorite_level) ||
          // specific preset_mode with no specific favorite level
          (preset_mode === attributes.preset_mode &&
            !xiaomi_miio_favorite_level);

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

    const { state } = this.entity;

    const stateClass = state === 'on' ? 'working' : 'standby';
    const className = !this.compactView ? stateClass : 'compact';

    return html`
      <ha-card>
        <div
          class="preview"
          @click="${() => this.handleMore()}"
          ?more-info="true"
        >
          <div class="header">
            <div class="speed">${this.renderSpeed()}</div>
            <div class="preset-mode">${this.renderPresetMode()}</div>
          </div>

          <div class="image ${className}">${this.renderAQI()}</div>

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
