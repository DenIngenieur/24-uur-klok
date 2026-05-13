# 🕰️ Holoceen Klok – 24u linksom, met zon, maan en 10.000 jaar geschiedenis

Een bijzondere klok die **tegen de klok in loopt**, **24 uur** toont, en de stand van de zon en maan laat zien – gebaseerd op jouw locatie en de echte sterrenkunde.

Zie het ding in werking: [naar de klok](https://deningenieur.github.io/24-uur-klok/)

_🇬🇧 English version below_

* * *

## ✨ Wat maakt deze klok anders?

  * **12 uur (middag) staat boven**, middernacht (0 uur) onder
  * **Tegen de klok in** – de tijd loopt linksom
  * **Zonsopgang / zonsondergang** bepaalt een vloeiend kleurenverloop op de wijzerplaat: diepblauwe nacht → paarse schemeringen → rozig ochtendgloren → warm gouden dag → oranje zonsondergang → en weer terug
  * **Schijngestalten van de maan** in het midden van de wijzerplaat, inclusief parallactische rotatie op basis van je breedtegraad
  * **Breedtegraad-schuifregelaar** – verken hoe de dag en nacht veranderen van pool tot pool, in real-time
  * **Dag-van-het-jaar schuifregelaar** – doorloop het volledige jaar en zie hoe de daglengte, schemeringen en maanfase mee veranderen met de seizoenen. De overgang van zomer- naar wintertijd (en omgekeerd) is als een plotse sprong in de schemering zichtbaar. De standaardpositie is vandaag, met een resetknop om altijd terug te keren.
  * **Holoceen kalender** – huidig jaar + 10.000 (bijv. 12026 HE)
  * **Uurwijzer-tracker** – een stip die het huidige uur volgt langs de rand

## 🔄 Waarom tegen de klok in?

Op het zuidelijk halfrond loopt de schaduw van een horizontale zonnewijzer **linksom** omdat de zon door de noordelijke hemel beweegt. De meeste klokken volgen de noordelijke conventie — deze klok volgt de natuur ten zuiden van de evenaar.

Door de geschiedenis heen hebben diverse culturen linksomlopende klokken omarmd:

  * **Testour, Tunesië** — Een 17e-eeuwse moskeeklok loopt achteruit als symbool voor de terugkeer naar Al-Andalus na de Inquisitie.
  * **Joodse klokken** — Gespiegeld vanwege de rechts-naar-links leesrichting van het Hebreeuws.
  * **Gujarat, India** — Tribale gemeenschappen merken op dat de aarde, de maan en waterdraaikolken allemaal linksom draaien. De natuur, stellen zij, beweegt zo.

## 🌾 Holoceen Kalender (HE)

Voorgesteld door natuurkundige Cesare Emiliani in 1993, telt de Holocene kalender 10.000 jaar op bij het AD/CE-jaar. 2026 → 12026 HE.

Waarom 10.000? Het Holoceen-tijdperk begon ~11.700 jaar geleden — toen de IJstijd eindigde, landbouw ontstond, en de eerste permanente nederzettingen werden gebouwd. De HE-kalender geeft ons een jaar nul en verankert tijd in geologie en beschaving, niet in religie.

⟡ Je leeft in het 12e millennium van de menselijke beschaving. ⟡

## 🌐 Vertalingen

De klok is ontworpen om eenvoudig vertaald te worden. Alle gebruikte tekst is gecentraliseerd, zodat je maar op twee plekken aanpassingen hoeft te doen:

1.  **`clock.js`** – In het `CONFIG`-object bovenaan vind je:
    *   **Maanfase-namen** (`moonPhaseNames`)
    *   **Locatie- en statusberichten** (`location`)
    *   **Labels voor schuifregelaars en de weergave van het halfrond** (`labels`, `hemisphere`, `coordinateDisplay`)
    *   Alle Nederlandse vertalingen staan al klaar als commentaar naast de Engelse tekst — je kunt ze eenvoudig activeren door het commentaar te wisselen.

2.  **`index.html`** – Een paar labels die door de browser zelf worden getoond, moeten hier handmatig vertaald worden:
    *   De `<title>` van de pagina.
    *   Eventuele vaste tekst in de HTML-structuur die buiten de dynamische JavaScript-elementen valt.
    *   Bij de sliders en knoppen staat commentaar met de Nederlandse vertaling, klaar om te activeren.

## 🌍 Werkt écht

  * Vraagt locatie (toestemming) voor nauwkeurige zonsopkomst, zonsondergang en alle schemeringen
  * Zonder locatie → valt terug op 50.81°N, 3.11°O (Vlaanderen, België)
  * **Breedtegraad-schuifregelaar** – sleep van 90°N naar 90°Z om te zien hoe dag/nacht en de maanoriëntatie veranderen
  * **Dag-van-het-jaar schuifregelaar** – sleep van 1 januari tot 31 december om de seizoenen te doorlopen
  * Resetknoppen om terug te keren naar je echte locatie en de echte datum
  * Maanstand wordt berekend op basis van de J2000 Epoch Nieuwe Maan (6 januari 2000, 18:14 UTC) met de precieze synodische maand van 29,530588853 dagen
  * Toont maanfase, symbool en verlichtingspercentage
  * Werkt correct op alle breedtegraden, inclusief pooldag, poolnacht, en gedeeltelijke schemeringen
  * Houdt rekening met schrikkeljaren (366 dagen) en zomer-/wintertijd

## 📁 Bestanden en pagina's

Het project bevat drie HTML-pagina's met elk een eigen functie:

  * **`index.html`** – de hoofdklok. Toont de 24-uurs wijzerplaat met dag/nacht-verloop, maanfase, Holoceen-tijdstempel, en schuifregelaars voor breedtegraad en dag van het jaar.
  * **`sun.html`** – de zonnecalculator. Geeft voor een opgegeven datum en locatie de precieze tijden van zonsopgang, zonsondergang en alle drie de schemeringen (civiel, nautisch, astronomisch). Toont ook de actuele zonnepositie (altitude, declinatie, rechte klimming, uurhoek) en de positie om 12:00 UTC. Handig voor fotografen, astronomen, of gewoon uit nieuwsgierigheid.
  * **`moonphase.html`** – de maanfase-visualisator. Een interactieve demo die toont hoe de maan eruitziet bij een bepaalde verlichtingsgraad en breedtegraad, met parallactische rotatie. Handig om het maanmodel los van de klok te begrijpen en te testen.

De JavaScript-logica is verdeeld over twee bestanden:

  * **`astro.js`** – astronomische berekeningen (Juliaanse dag, zonspositie, zonsopkomst/ondergang, schemeringen, zonnemiddag/nadir) én maanfase-berekeningen op basis van de J2000 Epoch Nieuwe Maan en de synodische maand
  * **`clock.js`** – alle tekenlogica voor de klok (gradiënt, maan, wijzerplaat, wijzers, tracker, schuifregelaars)

En de opmaak:

  * **`style.css`** – pagina-layout (body, container)
  * **`clock.css`** – klok-specifieke stijl (canvas, labels, schuifregelaars)

## 🚀 Live gebruiken

  1. Download de bestanden in één map.
  2. Open `index.html` in een moderne browser (Chrome, Firefox, Edge).
  3. Geef toestemming voor locatie (voor echte zonsopkomst/ondergang).
  4. Gebruik de schuifregelaars om breedtegraden en dagen te verkennen.
  5. Klaar – de klok draait.

## 🎨 Configuratie

Alle instellingen staan bovenaan `clock.js` in het `CONFIG` object:

```javascript
const CONFIG = {
    size: 500,
    showEveryNthHour: 1,
    showEveryNthMinute: 5,
    gradientMargin: 25,
    gradientOpacity: 0.85,
    gradientSteps: 720, // 0.5° per step
    locationPrecision: 2, // decimal places for location cache key
    
    hourTrackerEnabled: true,
    hourTrackerRadius: 5,
    hourTrackerGlow: true,
    
    // Moon settings
    moonRadiusRatio: 0.33,      // 1/3 of clock radius
    moonGlowBlur: 6,
    moonGlowOpacity: 0.15,
    moonDarkColor: "#1a1d2e",
    moonLightColor: "#fff8e0",
    moonBorderColor: "rgba(255,255,240,0.3)",

    // Translations
    moonPhaseNames: {
        // "New Moon": "Nieuwe Maan",
        "New Moon": "New Moon",
        // "Waxing Crescent": "Wassende Halve Maan",
        "Waxing Crescent": "Waxing Crescent",
        // "First Quarter": "Eerste Kwartier",
        "First Quarter": "First Quarter",
        // "Waxing Gibbous": "Wassende Maan",
        "Waxing Gibbous": "Waxing Gibbous",
        // "Full Moon": "Volle Maan",
        "Full Moon": "Full Moon",
        // "Waning Gibbous": "Afnemende Maan",
        "Waning Gibbous": "Waning Gibbous",
        // "Last Quarter": "Laatste Kwartier",
        "Last Quarter": "Last Quarter",
        // "Waning Crescent": "Afnemende Halve Maan"
        "Waning Crescent": "Waning Crescent"
    },
    // translation location-related messages
    location: {
        // "geolocationNotSupported": "🌐 Geolocatie wordt niet ondersteund – standaardwaarde 50.81°N, 3.11°E gebruikt",
        geolocationNotSupported: "🌐 Geolocation not supported – using fallback 50.81°N, 3.11°E",
        // "requestingLocation": "📍 Locatie wordt opgehaald...",
        requestingLocation: "📍 Requesting location...",
        // "geolocationDenied": "⚠️ Locatietoegang geweigerd – standaardwaarde 50.81°N, 3.11°E gebruikt",
        geolocationDenied: "⚠️ Geolocation denied – using fallback 50.81°N, 3.11°E",
        fallbackCoordinates: { latitude: 50.81, longitude: 3.11 },
        fallbackCoordinatesText: "50.81°N, 3.11°E"
    },
    hemisphere: {
        // "northern": "Noordelijk",
        northern: "Northern",
        // "southern": "Zuidelijk"
        southern: "Southern"
    },
    coordinateDisplay: {
        // "format": "🌞 {hemisphere} halfrond | {latitude}° {longitude}°"
        format: "🌞 {hemisphere} hemisphere | {latitude}° {longitude}°"
    },
    // labels for feedback. Change these value to translate the UI label.
    labels: {
        // day: "Dag",
        day: "Day",
        // latitude: "Breedtegraad"
        latitude: "Latitude"
    },

    // Colours to choose :-)
    colors: {
        background: "#0a0e1a",
        dialFace: "#111625",
        dialBorder: "#2a3550",
        marginRing: "#1a1e2e",
        textGeneral: "#fff5e0",
        minuteMarkers: "#ffffff",
        hourHand: "#f0f3ff",
        minuteHand: "#b9c7d9",
        secondHand: "#ff4d6d",
        tickMajor: "#ffffff",
        tickMinor: "#5b6e8c",
        // Twilight anchor colors (HSL values) - more natural sky colors
        deepNight: { h: 235, s: 70, l: 8 },
        astronomical: { h: 240, s: 55, l: 18 },
        nautical: { h: 250, s: 40, l: 30 },
        civil: { h: 280, s: 30, l: 45 },
        sunrise: { h: 35, s: 60, l: 55 },
        solarNoon: { h: 50, s: 40, l: 75 },
        polarDay: { h: 51, s: 100, l: 70 }
    },
    
    handLengths: { hour: 0.38, minute: 0.58, second: 0.72 },
    handWidths: { hour: 6, minute: 4, second: 2 },
    updateInterval: 250,
};
```

# 🕰️ Holocene Clock – 24h counterclockwise, with sun, moon and 10,000 years of history

A remarkable clock that runs **counterclockwise**, displays **24 hours**, and shows the position of sun and moon – based on your location and real astronomy.

See it in action: [to the clock](https://deningenieur.github.io/24-uur-klok/)

* * *

## ✨ What makes this clock different?

  * **12 o'clock (noon) is at the top**, midnight (0h) at the bottom
  * **Counterclockwise** – time moves leftwards
  * **Sunrise/sunset** creates a smooth colour gradient on the dial: deep blue night → purple twilights → rosy dawn → warm golden day → orange sunset → and back again
  * **Moon phases** displayed in the centre of the dial, including parallactic rotation based on your latitude
  * **Latitude slider** – explore how day and night change from pole to pole, in real-time
  * **Day-of-year slider** – scrub through the entire year and watch day length, twilights, and moon phases shift with the seasons. The daylight saving time transitions appear as sudden jumps in the twilight bands — a quiet reminder that the sun doesn't care about our clocks. Defaults to today, with a reset button to always return.
  * **Holocene calendar** – current year + 10,000 (e.g. 12026 HE)
  * **Hour tracker** – a dot that follows the current hour along the edge

## 🔄 Why counterclockwise?

In the southern hemisphere, a horizontal sundial's shadow moves **counterclockwise** because the sun arcs through the northern sky. Most clocks follow the northern convention — this clock follows nature south of the equator.

Throughout history, various cultures have embraced counterclockwise clocks:

  * **Testour, Tunisia** — A 17th-century mosque clock runs backwards as a symbol of returning to Al-Andalus after the Inquisition.
  * **Jewish clocks** — Mirrored due to Hebrew's right-to-left reading direction.
  * **Gujarat, India** — Tribal communities note that Earth, the moon, and water vortices all spin counterclockwise. Nature, they argue, moves this way.

## 🌾 Holocene Era (HE)

Proposed by physicist Cesare Emiliani in 1993, the Holocene calendar adds 10,000 years to the AD/CE year. 2026 → 12026 HE.

Why 10,000? The Holocene Epoch began ~11,700 years ago — when the Ice Age ended, agriculture began, and the first permanent settlements arose. The HE calendar gives us a year zero and anchors time to geology and civilisation, not religion.

⟡ You are living in the 12th millennium of human civilisation. ⟡

## 🌐 Translations

The clock is designed to be easily translatable. All user-facing strings are centralized, so you only need to modify two areas:

1.  **`clock.js`** – In the `CONFIG` object at the top, you'll find:
    *   **Moon phase names** (`moonPhaseNames`)
    *   **Location and status messages** (`location`)
    *   **Slider labels and hemisphere display** (`labels`, `hemisphere`, `coordinateDisplay`)
    *   Dutch translations are already included as comments next to the English text — simply swap the comments to activate them.

2.  **`index.html`** – A few browser-level labels need manual translation here:
    *   The page's `<title>` tag.
    *   Any static text within the HTML structure that falls outside the dynamic JavaScript elements.
    *   The sliders and buttons have Dutch translations ready in comments, ready to be activated.

## 🌍 It really works

  * Requests location (permission) for accurate sunrise, sunset and all twilights
  * Without location → falls back to 50.81°N, 3.11°E (Flanders, Belgium)
  * **Latitude slider** – drag from 90°N to 90°S to see how day/night and moon orientation change
  * **Day-of-year slider** – drag from January 1 to December 31 to travel through the seasons
  * Reset buttons to return to your real location and today's date
  * Moon phase calculated using the J2000 Epoch New Moon (January 6, 2000, 18:14 UTC) with the precise synodic month of 29.530588853 days
  * Displays moon phase name, symbol and illumination percentage
  * Works correctly at all latitudes, including polar day, polar night, and partial twilights
  * Accounts for leap years (366 days) and daylight saving time

## 📁 Files and pages

The project contains three HTML pages, each with its own purpose:

  * **`index.html`** – the main clock. Shows the 24-hour dial with day/night gradient, moon phase, Holocene timestamp, and sliders for latitude and day of year.
  * **`sun.html`** – the solar calculator. For a given date and location, shows precise sunrise, sunset and all three twilight times (civil, nautical, astronomical). Also displays current sun position (altitude, declination, right ascension, hour angle) and the position at 12:00 UTC. Useful for photographers, astronomers, or plain curiosity.
  * **`moonphase.html`** – the moon phase visualiser. An interactive demo showing how the moon appears at a given illumination percentage and latitude, with parallactic rotation. Useful for understanding and testing the moon model separately from the clock.

The JavaScript logic is split across two files:

  * **`astro.js`** – astronomical calculations (Julian date, sun position, sunrise/sunset, twilights, solar noon/nadir) and moon phase calculations based on the J2000 Epoch New Moon and synodic month
  * **`clock.js`** – all clock drawing logic (gradient, moon, dial, hands, tracker, sliders)

And the styling:

  * **`style.css`** – page layout (body, container)
  * **`clock.css`** – clock-specific styling (canvas, labels, sliders)

## 🚀 Use it live

  1. Download the files into one folder.
  2. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
  3. Grant location permission (for real sunrise/sunset times).
  4. Use the sliders to explore different latitudes and days.
  5. Done – the clock is running.

## 🎨 Configuration

All settings are at the top of `clock.js` in the `CONFIG` object:

```javascript
const CONFIG = {
    size: 500,
    showEveryNthHour: 1,
    showEveryNthMinute: 5,
    gradientMargin: 25,
    gradientOpacity: 0.85,
    gradientSteps: 720, // 0.5° per step
    locationPrecision: 2, // decimal places for location cache key
    
    hourTrackerEnabled: true,
    hourTrackerRadius: 5,
    hourTrackerGlow: true,
    
    // Moon settings
    moonRadiusRatio: 0.33,      // 1/3 of clock radius
    moonGlowBlur: 6,
    moonGlowOpacity: 0.15,
    moonDarkColor: "#1a1d2e",
    moonLightColor: "#fff8e0",
    moonBorderColor: "rgba(255,255,240,0.3)",

    // Translations
    moonPhaseNames: {
        // "New Moon": "Nieuwe Maan",
        "New Moon": "New Moon",
        // "Waxing Crescent": "Wassende Halve Maan",
        "Waxing Crescent": "Waxing Crescent",
        // "First Quarter": "Eerste Kwartier",
        "First Quarter": "First Quarter",
        // "Waxing Gibbous": "Wassende Maan",
        "Waxing Gibbous": "Waxing Gibbous",
        // "Full Moon": "Volle Maan",
        "Full Moon": "Full Moon",
        // "Waning Gibbous": "Afnemende Maan",
        "Waning Gibbous": "Waning Gibbous",
        // "Last Quarter": "Laatste Kwartier",
        "Last Quarter": "Last Quarter",
        // "Waning Crescent": "Afnemende Halve Maan"
        "Waning Crescent": "Waning Crescent"
    },
    // translation location-related messages
    location: {
        // "geolocationNotSupported": "🌐 Geolocatie wordt niet ondersteund – standaardwaarde 50.81°N, 3.11°E gebruikt",
        geolocationNotSupported: "🌐 Geolocation not supported – using fallback 50.81°N, 3.11°E",
        // "requestingLocation": "📍 Locatie wordt opgehaald...",
        requestingLocation: "📍 Requesting location...",
        // "geolocationDenied": "⚠️ Locatietoegang geweigerd – standaardwaarde 50.81°N, 3.11°E gebruikt",
        geolocationDenied: "⚠️ Geolocation denied – using fallback 50.81°N, 3.11°E",
        fallbackCoordinates: { latitude: 50.81, longitude: 3.11 },
        fallbackCoordinatesText: "50.81°N, 3.11°E"
    },
    hemisphere: {
        // "northern": "Noordelijk",
        northern: "Northern",
        // "southern": "Zuidelijk"
        southern: "Southern"
    },
    coordinateDisplay: {
        // "format": "🌞 {hemisphere} halfrond | {latitude}° {longitude}°"
        format: "🌞 {hemisphere} hemisphere | {latitude}° {longitude}°"
    },
    // labels for feedback. Change these value to translate the UI label.
    labels: {
        // day: "Dag",
        day: "Day",
        // latitude: "Breedtegraad"
        latitude: "Latitude"
    },

    // Colours to choose :-)
    colors: {
        background: "#0a0e1a",
        dialFace: "#111625",
        dialBorder: "#2a3550",
        marginRing: "#1a1e2e",
        textGeneral: "#fff5e0",
        minuteMarkers: "#ffffff",
        hourHand: "#f0f3ff",
        minuteHand: "#b9c7d9",
        secondHand: "#ff4d6d",
        tickMajor: "#ffffff",
        tickMinor: "#5b6e8c",
        // Twilight anchor colors (HSL values) - more natural sky colors
        deepNight: { h: 235, s: 70, l: 8 },
        astronomical: { h: 240, s: 55, l: 18 },
        nautical: { h: 250, s: 40, l: 30 },
        civil: { h: 280, s: 30, l: 45 },
        sunrise: { h: 35, s: 60, l: 55 },
        solarNoon: { h: 50, s: 40, l: 75 },
        polarDay: { h: 51, s: 100, l: 70 }
    },
    
    handLengths: { hour: 0.38, minute: 0.58, second: 0.72 },
    handWidths: { hour: 6, minute: 4, second: 2 },
    updateInterval: 250,
};
```

