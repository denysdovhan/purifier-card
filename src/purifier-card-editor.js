import { LitElement, html, css } from 'lit-element';
import { fireEvent } from 'custom-card-helpers';
import localize from './localize';

export class PurifierCardEditor extends LitElement {
  static get properties() {
    return {
      hass: Object,
      _config: Object,
      _toggle: Boolean,
    };
  }

  setConfig(config) {
    this._config = config;

    if (!this._config.entity) {
      this._config.entity = this.getEntitiesByType('fan')[0] || '';
      fireEvent(this, 'config-changed', { config: this._config });
    }
  }

  get _entity() {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _show_name() {
    if (this._config) {
      return this._config.show_name || true;
    }

    return '';
  }

  get _show_state() {
    if (this._config) {
      return this._config.show_state || true;
    }

    return '';
  }

  get _show_toolbar() {
    if (this._config) {
      return this._config.show_toolbar || true;
    }

    return true;
  }

  get _compact_view() {
    if (this._config) {
      return this._config.compact_view || false;
    }

    return false;
  }

  getEntitiesByType(type) {
    return Object.keys(this.hass.states).filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === type
    );
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const fanEntities = this.getEntitiesByType('fan');

    return html`
      <div class="card-config">
        <paper-dropdown-menu
          label="${localize('editor.entity')}"
          @value-changed=${this._valueChanged}
          .configValue=${'entity'}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${fanEntities.indexOf(this._entity)}
          >
            ${fanEntities.map((entity) => {
              return html` <paper-item>${entity}</paper-item> `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>

        <p class="option">
          <ha-switch
            aria-label=${localize(
              this._show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on'
            )}
            .checked=${this._show_name !== false}
            .configValue=${'show_name'}
            @change=${this._valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </p>

        <p class="option">
          <ha-switch
            aria-label=${localize(
              this._show_state
                ? 'editor.show_state_aria_label_off'
                : 'editor.show_state_aria_label_on'
            )}
            .checked=${this._show_state !== false}
            .configValue=${'show_state'}
            @change=${this._valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_state')}
        </p>

        <p class="option">
          <ha-switch
            aria-label=${localize(
              this._show_name
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on'
            )}
            .checked=${this._show_toolbar !== false}
            .configValue=${'show_toolbar'}
            @change=${this._valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
        </p>

        <strong>
          ${localize('editor.code_only_note')}
        </strong>
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles() {
    return css`
      .card-config paper-dropdown-menu {
        width: 100%;
      }

      .option {
        display: flex;
        align-items: center;
      }

      .option ha-switch {
        margin-right: 10px;
      }
    `;
  }
}

customElements.define('purifier-card-editor', PurifierCardEditor);
