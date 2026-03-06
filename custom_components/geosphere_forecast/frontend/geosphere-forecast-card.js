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
    const updatedLabel = this._formatUpdated(attrs.last_updated);

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
        const iconSvg = this._symbolSvg(symbolCode);

        return `
          <div class="day-col">
            <div class="day-title">${date}</div>
            <div class="weather-icon" aria-hidden="true">${iconSvg}</div>
            <div class="temp-line"><span class="high">${high}</span> <span class="low">${low}</span></div>
            <div class="symbol-text">${symbolText}</div>
          </div>
        `;
      })
      .join("");

    this._content.innerHTML = `
      <style>
        .geosphere-wrap { padding: 12px; }
        .location-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .location { font-weight: 600; font-size: 16px; }
        .updated { font-size: 11px; opacity: 0.8; text-align: right; white-space: nowrap; }
        .days-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
        .day-col {
          border: 1px solid var(--divider-color);
          border-radius: 8px;
          padding: 6px 3px;
          text-align: center;
          background: var(--card-background-color);
        }
        .day-title { font-size: 11px; font-weight: 600; margin-bottom: 3px; }
        .weather-icon {
          width: 30px;
          height: 30px;
          margin: 0 auto 3px;
          color: var(--primary-color);
        }
        .weather-icon svg {
          width: 30px;
          height: 30px;
          display: block;
          overflow: visible;
        }
        .temp-line { font-size: 12px; margin-bottom: 2px; white-space: nowrap; }
        .high { font-weight: 700; margin-right: 4px; }
        .low { opacity: 0.8; }
        .symbol-text { font-size: 10px; opacity: 0.8; line-height: 1.2; min-height: 24px; }
        @media (max-width: 420px) {
          .geosphere-wrap { padding: 8px; }
          .location-row { margin-bottom: 8px; }
          .location { font-size: 14px; }
          .updated { font-size: 10px; }
          .days-grid { gap: 3px; }
          .day-col { padding: 5px 2px; }
          .day-title { font-size: 10px; }
          .weather-icon, .weather-icon svg { width: 24px; height: 24px; }
          .temp-line { font-size: 11px; }
          .symbol-text { font-size: 9px; min-height: 20px; }
        }
      </style>
      <div class="geosphere-wrap">
        <div class="location-row">
          <div class="location">${locationName}</div>
          <div class="updated">${updatedLabel}</div>
        </div>
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

  _formatUpdated(value) {
    if (!value) {
      return "Aktualisiert: -";
    }
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) {
      return "Aktualisiert: -";
    }
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `Aktualisiert ${dd}.${mm}.${yy} um ${hh}:${min} Uhr`;
  }

  getCardSize() {
    return 5;
  }

  _symbolType(code) {
    if ([1].includes(code)) return "sun";
    if ([2, 3].includes(code)) return "partly";
    if ([4, 5].includes(code)) return "cloud";
    if ([6, 7].includes(code)) return "fog";
    if ([8, 9, 17, 18].includes(code)) return "rain";
    if ([10, 19].includes(code)) return "rain-heavy";
    if ([11, 12, 13, 20, 21, 22].includes(code)) return "sleet";
    if ([14, 23, 24].includes(code)) return "snow";
    if ([15, 16, 25].includes(code)) return "snow-heavy";
    if ([26, 27, 28, 29, 30, 31, 32].includes(code)) return "thunder";
    return "cloud";
  }

  _symbolSvg(code) {
    const type = this._symbolType(code);
    const cSun = "#f6c443";
    const cCloud = "#9fa4ab";
    const cCloudDark = "#5f646b";
    const cRain = "#7fc8ff";
    const cFog = "#ffffff";
    const cStroke = "#6f7680";
    const cBolt = "#ffd54f";
    const cSnow = "#ffffff";

    const sun = `
      <circle cx="12" cy="10.5" r="4.3" fill="${cSun}" stroke="#d6a72a" stroke-width="0.8"/>
      <path d="M12 2.4v2.3M12 16.4v2.3M4 10.5h2.3M17.7 10.5H20M6.1 4.6l1.6 1.6M16.3 14.8l1.6 1.6M6.1 16.4l1.6-1.6M16.3 6.2l1.6-1.6" fill="none" stroke="${cSun}" stroke-linecap="round" stroke-width="1.6"/>
    `;
    const cloud = `
      <path d="M7.1 18h10.2a3.8 3.8 0 0 0 0-7.6h-.2a4.9 4.9 0 0 0-9.4-1.3 3.8 3.8 0 1 0-.6 7.6Z" fill="${cCloud}" stroke="${cStroke}" stroke-linejoin="round" stroke-width="1"/>
    `;
    const cloudDark = `
      <path d="M7.1 18h10.2a3.8 3.8 0 0 0 0-7.6h-.2a4.9 4.9 0 0 0-9.4-1.3 3.8 3.8 0 1 0-.6 7.6Z" fill="${cCloudDark}" stroke="#4b4f55" stroke-linejoin="round" stroke-width="1"/>
    `;
    const rainDrops = `
      <ellipse cx="9" cy="21" rx="1.1" ry="1.7" fill="${cRain}"/>
      <ellipse cx="13" cy="21.2" rx="1.1" ry="1.7" fill="${cRain}"/>
      <ellipse cx="17" cy="21" rx="1.1" ry="1.7" fill="${cRain}"/>
    `;
    const heavyRainDrops = `
      <ellipse cx="8" cy="21" rx="1.1" ry="1.8" fill="${cRain}"/>
      <ellipse cx="11.5" cy="21.2" rx="1.1" ry="1.8" fill="${cRain}"/>
      <ellipse cx="15" cy="21" rx="1.1" ry="1.8" fill="${cRain}"/>
      <ellipse cx="18.5" cy="21.2" rx="1.1" ry="1.8" fill="${cRain}"/>
    `;
    const snowFlakes = `
      <circle cx="10" cy="21" r="1.1" fill="${cSnow}" stroke="#e8edf3" stroke-width="0.6"/>
      <circle cx="15.5" cy="21" r="1.1" fill="${cSnow}" stroke="#e8edf3" stroke-width="0.6"/>
    `;
    const thunder = `
      <path d="M13.6 14.2h-2.2l1-3.3-2.8 4.5h2.2l-.9 3 2.7-4.2Z" fill="${cBolt}" stroke="#d6ad2d" stroke-linejoin="round" stroke-width="0.9"/>
    `;
    const fog = `
      <path d="M4.5 10.8h15M3.5 13.7h17M5 16.6h14" fill="none" stroke="${cFog}" stroke-linecap="round" stroke-width="1.8"/>
    `;

    let body = cloud;
    if (type === "sun") {
      body = sun;
    } else if (type === "partly") {
      body = `<g opacity="0.95">${sun}</g>${cloud}`;
    } else if (type === "fog") {
      body = `${cloud}${fog}`;
    } else if (type === "rain") {
      body = `${cloud}${rainDrops}`;
    } else if (type === "rain-heavy") {
      body = `${cloud}${heavyRainDrops}`;
    } else if (type === "sleet") {
      body = `${cloud}${rainDrops}${snowFlakes}`;
    } else if (type === "snow") {
      body = `${cloud}${snowFlakes}`;
    } else if (type === "snow-heavy") {
      body = `${cloud}${snowFlakes}<circle cx="20" cy="21" r="1.1" fill="${cSnow}" stroke="#e8edf3" stroke-width="0.6"/>`;
    } else if (type === "thunder") {
      body = `${cloudDark}${thunder}`;
    }

    return `<svg viewBox="0 0 24 24" role="img" focusable="false">${body}</svg>`;
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
