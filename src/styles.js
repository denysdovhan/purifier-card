import { css, unsafeCSS } from 'lit-element';
import workingImg from './images/purifier-working.gif';
import standbyImg from './images/purifier-standby.png';

export default css`
  :host {
    display: flex;
    flex: 1;
    flex-direction: column;
  }

  ha-card {
    flex-direction: column;
    flex: 1;
    position: relative;
    padding: 0px;
    border-radius: 4px;
    overflow: hidden;
  }

  .fill-gap {
    flex-grow: 1;
  }

  .preview {
    background-color: var(--primary-color);
    overflow: hidden;
    position: relative;
  }

  .header {
    display: flex;
    justify-content: space-between;
    color: var(--text-primary-color);
  }

  .preset-mode {
    padding: 7px;
  }

  .preset-mode ha-icon {
    display: inline-block;
  }

  .more-info {
    color: var(--text-primary-color);
  }

  .controls {
    display: flex;
    justify-content: center;
  }

  .slider {
    height: 100%;
    width: 100%;
    position: relative;
    max-width: 250px;
    min-width: 100px;
  }

  .slider-center {
    position: absolute;
    width: calc(100% - 90px);
    height: calc(100% - 10px);
    box-sizing: border-box;
    border-radius: 100%;
    left: 45px;
    top: 20px;
    text-align: center;
    overflow-wrap: break-word;
    pointer-events: none;
  }

  .slider-content {
    position: absolute;
    transform: translate(-50%, -50%);
    width: 100%;
    top: 50%;
    left: 50%;
  }

  .slider-value {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    font-size: 16px;
    color: var(--text-primary-color);
  }

  .image {
    background: center / contain no-repeat;
  }

  .image.working {
    background-image: url(${unsafeCSS(workingImg)});
  }

  .image.standby {
    background-image: url(${unsafeCSS(standbyImg)});
  }

  .image.compact {
    background-image: none;
    height: auto;
  }

  .preview.not-available {
    filter: grayscale(1);
  }

  .number-off {
    opacity: 0.2;
  }

  .current-aqi {
    font-size: 48px;
    font-weight: bold;
    line-height: 48px;
    padding: 5px 10px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: var(--text-primary-color);
  }

  .current-aqi sup {
    font-size: 16px;
    line-height: 16px;
    font-weight: normal;
  }

  .state {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .state-text {
    color: var(--text-primary-color);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    margin-left: calc(20px + 9px); /* size + margin of spinner */
  }

  .state ha-circular-progress {
    --mdc-theme-primary: var(
      --card-background-color
    ); /* hack to override the color */
    min-width: 24px;
    width: 24px;
    height: 24px;
    margin-left: 9px;
  }

  .friendly-name {
    text-align: center;
    font-weight: bold;
    color: var(--text-primary-color);
    font-size: 16px;
  }

  .not-available {
    text-align: center;
    color: var(--text-primary-color);
    font-size: 16px;
  }

  .metadata {
    margin: 10px auto;
  }

  .stats {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    color: var(--text-primary-color);
  }

  .stats-block {
    margin: 10px 0px;
    text-align: center;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    flex-grow: 1;
  }

  .stats-block:last-child {
    border: 0px;
  }

  .stats-value {
    font-size: 20px;
    font-weight: bold;
  }

  ha-icon {
    display: flex;
    color: #fff;
  }

  .toolbar {
    background: var(--lovelace-background, var(--primary-background-color));
    min-height: 30px;
    display: flex;
    flex-direction: row;
    flex-flow: row wrap;
    flex-wrap: wrap;
    justify-content: space-evenly;
  }

  .toolbar ha-icon-button {
    color: var(--primary-color);
    flex-direction: column;
    width: 44px;
    height: 44px;
    --mdc-icon-button-size: 44px;
    margin: 5px 0;
    opacity: 0.5;
  }

  .toolbar ha-icon-button.active {
    opacity: 1;
  }

  .toolbar ha-icon-button:first-child {
    margin-left: 5px;
  }

  .toolbar ha-icon-button:last-child {
    margin-right: 5px;
  }

  .toolbar paper-button {
    color: var(--primary-color);
    flex-direction: column;
    margin-right: 10px;
    padding: 15px 10px;
    cursor: pointer;
  }

  .toolbar ha-icon-button:active,
  .toolbar paper-button:active {
    opacity: 0.4;
    background: rgba(0, 0, 0, 0.1);
  }

  .toolbar paper-button {
    color: var(--primary-color);
    flex-direction: row;
  }

  .toolbar ha-icon {
    color: var(--primary-color);
  }
`;
