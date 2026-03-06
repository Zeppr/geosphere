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
        .weather-icon {
          width: 24px;
          height: 24px;
          margin: 0 auto 3px;
          color: var(--primary-color);
        }
        .weather-icon svg {
          width: 24px;
          height: 24px;
          display: block;
          overflow: visible;
        }
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
          .weather-icon, .weather-icon svg { width: 20px; height: 20px; }
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
    const stroke = "currentColor";
    const sun = `
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="${stroke}" stroke-width="1.8"/>
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.8"/>
    `;
    const cloud = `
      <path d="M7.2 17.5h9.7a3.4 3.4 0 0 0 .2-6.8 4.8 4.8 0 0 0-9.3-1.4 3 3 0 0 0-.6 0 3.6 3.6 0 1 0 0 7.2Z" fill="none" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.8"/>
    `;
    const rainDrops = `
      <path d="M9 19.2l-1 2M13 19.2l-1 2M17 19.2l-1 2" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.8"/>
    `;
    const heavyRainDrops = `
      <path d="M8 18.8l-1.2 2.8M12 18.8l-1.2 2.8M16 18.8l-1.2 2.8M20 18.8l-1.2 2.8" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.8"/>
    `;
    const snowFlakes = `
      <path d="M9 20.2h2M10 19.2v2M14.5 20.2h2M15.5 19.2v2" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.6"/>
    `;
    const thunder = `
      <path d="M13.6 14.5h-2.2l1-3.3-2.8 4.5h2.2l-.9 2.8 2.7-4Z" fill="none" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.8"/>
    `;
    const fog = `
      <path d="M4 11h16M3 14h18M5 17h14" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.7"/>
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
      body = `${cloud}${snowFlakes}<path d="M18.5 19.2h2M19.5 18.2v2" fill="none" stroke="${stroke}" stroke-linecap="round" stroke-width="1.6"/>`;
    } else if (type === "thunder") {
      body = `${cloud}${thunder}`;
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
