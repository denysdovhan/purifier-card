import { HomeAssistant } from 'custom-card-helpers';
import { Connection } from 'home-assistant-js-websocket';
import { LitElement, PropertyValues, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type TemplateSubscription = ReturnType<Connection['subscribeMessage']>;

@customElement('purifier-stat-template')
export class PurifierStatTemplate extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() public template = '';
  @property({ attribute: false }) public value: unknown = null;

  @state() private renderedValue: unknown = null;

  private generation = 0;
  private subscription: TemplateSubscription | null = null;
  private refreshTask: Promise<void> = Promise.resolve();

  public connectedCallback() {
    super.connectedCallback();
    this.queueRefresh();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this.queueRefresh();
  }

  protected updated(changedProps: PropertyValues) {
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

    if (changedProps.has('template')) {
      this.renderedValue = null;
    }

    if (
      changedProps.has('template') ||
      changedProps.has('value') ||
      (changedProps.has('hass') && oldHass?.connection !== this.hass?.connection)
    ) {
      this.queueRefresh();
    }
  }

  protected render(): unknown {
    // Keep the last formatted result while a new subscription is pending.
    // On first load, wait for the template instead of showing the raw input.
    return this.renderedValue ?? nothing;
  }

  private queueRefresh() {
    const generation = ++this.generation;
    this.refreshTask = this.refreshTask
      .then(() => this.refreshSubscription(generation))
      .catch((error: unknown) => {
        console.error('purifier-card: Failed to refresh stats template', error);
      });
  }

  private async refreshSubscription(generation: number) {
    if (generation !== this.generation) {
      return;
    }

    await this.unsubscribe();

    if (
      generation !== this.generation ||
      !this.isConnected ||
      !this.hass ||
      !this.template
    ) {
      return;
    }

    this.subscription = this.hass.connection.subscribeMessage<{
      result: unknown;
    }>(
      (message) => {
        if (this.isConnected && generation === this.generation) {
          this.renderedValue = message.result;
        }
      },
      {
        type: 'render_template',
        template: this.template,
        variables: { value: this.value },
      },
    );

    // Handle subscription failures here rather than leaving a rejected promise.
    await this.subscription;
  }

  private async unsubscribe() {
    const subscription = this.subscription;
    this.subscription = null;

    if (!subscription) {
      return;
    }

    try {
      const unsubscribe = await subscription;
      await unsubscribe();
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== 'not_found') {
        console.error('purifier-card: Failed to unsubscribe stats template', error);
      }
    }
  }
}
