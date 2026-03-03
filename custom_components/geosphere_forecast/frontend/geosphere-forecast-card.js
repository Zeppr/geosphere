class GeosphereForecastCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this._config = {
      title: "7 Tage Wetter",
      days: 7,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._content) {
      const card = document.createElement("ha-card");
      card.header = this._config.title;
      this._content = document.createElement("div");
      this._content.style.padding = "12px";
      card.appendChild(this._content);
      this.appendChild(card);
    }

    const stateObj = hass.states[this._config.entity];
    if (!stateObj) {
      this._content.innerHTML = `<div>Entity nicht gefunden: ${this._config.entity}</div>`;
      return;
    }

    const attrs = stateObj.attributes || {};
    const daily = Array.isArray(attrs.daily) ? attrs.daily.slice(0, this._config.days) : [];
    const locationName = attrs.location_name || "Unbekannt";

    if (!daily.length) {
      this._content.innerHTML = "<div>Keine Vorhersagedaten verfuegbar.</div>";
      return;
    }

    const rows = daily
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
        const symbol = day.symbol != null ? `Symbol ${day.symbol}` : "-";
        const warning = day.warning != null ? day.warning : "-";

        return `
          <tr>
            <td>${date}</td>
            <td>${high} / ${low}</td>
            <td>${symbol}</td>
            <td>${warning}</td>
          </tr>
        `;
      })
      .join("");

    this._content.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px;">${locationName}</div>
      <table style="width:100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr>
            <th style="text-align:left; padding: 6px 4px;">Tag</th>
            <th style="text-align:left; padding: 6px 4px;">Max / Min</th>
            <th style="text-align:left; padding: 6px 4px;">Wetter</th>
            <th style="text-align:left; padding: 6px 4px;">Warnung</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
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

  static getStubConfig() {
    return {
      entity: "sensor.geosphere_forecast_forecast",
      title: "GeoSphere 7 Tage",
      days: 7,
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
