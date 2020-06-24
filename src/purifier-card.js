import {LitElement, html} from 'lit-element';
import { hasConfigOrEntityChanged } from 'custom-card-helpers';

import localize from './localize';
// import styles from './styles';

if (!customElements.get('ha-icon-button')) {
  customElements.define(
    'ha-icon-button',
    class extends customElements.get('paper-icon-button') {}
  );
}

class PurifierCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
  }

  // static get styles() {
  //   return styles;
  // }

  // static async getConfigElement() {
  //   return document.createElement('vacuum-card-editor');
  // }

  static getStubConfig(hass, entities) {
    const [purifierEntity] = entities.filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === 'fan'
    );

    return {
      entity: purifierEntity || '',
    };
  }

  get entity() {
    return this.hass.states[this.config.entity];
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error(localize('error.missing_entity'));
    }
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  render() {
    return html`
      <div>Hello, World</div>
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