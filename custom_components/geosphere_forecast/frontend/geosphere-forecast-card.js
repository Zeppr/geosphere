class GeosphereForecastCard extends HTMLElement {
  static DISPLAY_DAYS = 5;

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this._config = {
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._content) {
      const card = document.createElement("ha-card");
      this._content = document.createElement("div");
      card.appendChild(this._content);
      this.appendChild(card);
    }

    const stateObj = hass.states[this._config.entity];
    if (!stateObj) {
      this._content.innerHTML = `<div>Entity nicht gefunden: ${this._config.entity}</div>`;
      return;
    }

    const attrs = stateObj.attributes || {};
    const daily = Array.isArray(attrs.daily)
      ? attrs.daily.slice(0, GeosphereForecastCard.DISPLAY_DAYS)
      : [];
    const locationName = attrs.location_name || "Unbekannt";

    if (!daily.length) {
      this._content.innerHTML = `<div style="padding:12px;">Keine Vorhersagedaten verfuegbar.</div>`;
      return;
    }

    const daysHtml = daily
      .map((day) => {
        const date = day.datetime
          ? new Date(day.datetime).toLocaleDateString("de-AT", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })
          : "-";

        const high = this._formatTemp(day.high);
        const low = this._formatTemp(day.low);
        const symbolCode = Number(day.symbol);
        const symbolText = this._symbolText(symbolCode);
        const icon = this._symbolIcon(symbolCode);

        return `
          <div class="day-col">
            <div class="day-title">${date}</div>
            <ha-icon class="weather-icon" icon="${icon}"></ha-icon>
            <div class="temp-line"><span class="high">${high}</span> <span class="low">${low}</span></div>
            <div class="symbol-text">${symbolText}</div>
          </div>
        `;
      })
      .join("");

    this._content.innerHTML = `
      <style>
        .geosphere-wrap { padding: 12px; }
        .location { font-weight: 600; font-size: 16px; margin-bottom: 10px; }
        .days-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
        .day-col {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 6px 3px;
          text-align: center;
          background: var(--card-background-color);
        }
        .day-title { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
        .weather-icon { --mdc-icon-size: 24px; color: var(--primary-color); margin-bottom: 3px; }
        .temp-line { font-size: 12px; margin-bottom: 2px; white-space: nowrap; }
        .high { font-weight: 700; margin-right: 4px; }
        .low { opacity: 0.8; }
        .symbol-text { font-size: 10px; opacity: 0.8; line-height: 1.2; min-height: 24px; }
        @media (max-width: 420px) {
          .geosphere-wrap { padding: 8px; }
          .location { font-size: 14px; margin-bottom: 8px; }
          .days-grid { gap: 3px; }
          .day-col { padding: 5px 2px; }
          .day-title { font-size: 10px; }
          .weather-icon { --mdc-icon-size: 20px; }
          .temp-line { font-size: 11px; }
          .symbol-text { font-size: 9px; min-height: 20px; }
        }
      </style>
      <div class="geosphere-wrap">
        <div class="location">${locationName}</div>
        <div class="days-grid">${daysHtml}</div>
      </div>
    `;
  }

  _formatTemp(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return `${Math.round(Number(value))}°C`;
  }

  getCardSize() {
    return 5;
  }

  _symbolIcon(code) {
    // Material Design icon set mapping (compact and consistent in HA cards)
    const map = {
      1: "mdi:weather-sunny",
      2: "mdi:weather-partly-cloudy",
      3: "mdi:weather-partly-cloudy",
      4: "mdi:weather-cloudy",
      5: "mdi:weather-cloudy",
      6: "mdi:weather-fog",
      7: "mdi:weather-fog",
      8: "mdi:weather-rainy",
      9: "mdi:weather-rainy",
      10: "mdi:weather-pouring",
      11: "mdi:weather-snowy-rainy",
      12: "mdi:weather-snowy-rainy",
      13: "mdi:weather-snowy-rainy",
      14: "mdi:weather-snowy",
      15: "mdi:weather-snowy-heavy",
      16: "mdi:weather-snowy-heavy",
      17: "mdi:weather-rainy",
      18: "mdi:weather-rainy",
      19: "mdi:weather-pouring",
      20: "mdi:weather-snowy-rainy",
      21: "mdi:weather-snowy-rainy",
      22: "mdi:weather-snowy-rainy",
      23: "mdi:weather-snowy",
      24: "mdi:weather-snowy",
      25: "mdi:weather-snowy-heavy",
      26: "mdi:weather-lightning-rainy",
      27: "mdi:weather-lightning-rainy",
      28: "mdi:weather-lightning",
      29: "mdi:weather-lightning-rainy",
      30: "mdi:weather-lightning-rainy",
      31: "mdi:weather-lightning-rainy",
      32: "mdi:weather-lightning-rainy",
    };
    return map[code] || "mdi:weather-cloudy-alert";
  }

  _symbolText(code) {
    const map = {
      1: "Wolkenlos",
      2: "Heiter",
      3: "Wolkig",
      4: "Stark bewoelkt",
      5: "Bedeckt",
      6: "Bodennebel",
      7: "Hochnebel",
      8: "Leichter Regen",
      9: "Maessiger Regen",
      10: "Starker Regen",
      11: "Schneeregen",
      12: "Schneeregen",
      13: "Schneeregen",
      14: "Leichter Schneefall",
      15: "Maessiger Schneefall",
      16: "Starker Schneefall",
      17: "Regenschauer",
      18: "Regenschauer",
      19: "Starker Regenschauer",
      20: "Schneeregenschauer",
      21: "Schneeregenschauer",
      22: "Schneeregenschauer",
      23: "Schneeschauer",
      24: "Schneeschauer",
      25: "Starker Schneeschauer",
      26: "Gewitter",
      27: "Gewitter",
      28: "Starkes Gewitter",
      29: "Gewitter mit Schneeregen",
      30: "Starkes Gewitter mit Schneeregen",
      31: "Gewitter mit Schneefall",
      32: "Starkes Gewitter mit Schneefall",
    };
    return map[code] || "Unbekannt";
  }

  static getStubConfig() {
    return {
      entity: "sensor.geosphere_forecast_forecast",
    };
  }
}

customElements.define("geosphere-forecast-card", GeosphereForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "geosphere-forecast-card",
  name: "GeoSphere Forecast Card",
  description: "Zeigt 7 Tage Vorhersage aus der GeoSphere Integration",
});
