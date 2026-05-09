# 🕰️ Holoceen Klok – 24u linksom, met zon, maan en 10.000 jaar geschiedenis

Een bijzondere klok die **tegen de klok in loopt**, **24 uur** toont, en de stand van de zon en maan laat zien – gebaseerd op jouw locatie en de echte sterrenkunde.

Zie het ding in werking: [naar de klok](https://deningenieur.github.io/24-uur-klok/)

*🇬🇧 English version below*

---

## ✨ Wat maakt deze klok anders?

- **12 uur (middag) staat boven**, middernacht (0 uur) onder
- **Tegen de klok in** – de tijd loopt linksom
- **Zonsopgang / zonsondergang** bepaalt een vloeiend kleurenverloop op de wijzerplaat: diepblauwe nacht → paarse schemeringen → rozig ochtendgloren → warm gouden dag → oranje zonsondergang → en weer terug
- **Schijngestalten van de maan** in het midden van de wijzerplaat, inclusief parallactische rotatie op basis van je breedtegraad
- **Holoceen kalender** – huidig jaar + 10.000 (bijv. 12026 HE)
- **Uurwijzer-tracker** – een stip die het huidige uur volgt langs de rand

## 🔄 Waarom tegen de klok in?

Op het zuidelijk halfrond loopt de schaduw van een horizontale zonnewijzer **linksom** omdat de zon door de noordelijke hemel beweegt. De meeste klokken volgen de noordelijke conventie — deze klok volgt de natuur ten zuiden van de evenaar.

Door de geschiedenis heen hebben diverse culturen linksomlopende klokken omarmd:

- **Testour, Tunesië** — Een 17e-eeuwse moskeeklok loopt achteruit als symbool voor de terugkeer naar Al-Andalus na de Inquisitie.
- **Joodse klokken** — Gespiegeld vanwege de rechts-naar-links leesrichting van het Hebreeuws.
- **Gujarat, India** — Tribale gemeenschappen merken op dat de aarde, de maan en waterdraaikolken allemaal linksom draaien. De natuur, stellen zij, beweegt zo.

## 🌾 Holoceen Kalender (HE)

Voorgesteld door natuurkundige Cesare Emiliani in 1993, telt de Holocene kalender 10.000 jaar op bij het AD/CE-jaar. 2026 → 12026 HE.

Waarom 10.000? Het Holoceen-tijdperk begon ~11.700 jaar geleden — toen de IJstijd eindigde, landbouw ontstond, en de eerste permanente nederzettingen werden gebouwd. De HE-kalender geeft ons een jaar nul en verankert tijd in geologie en beschaving, niet in religie.

⟡ Je leeft in het 12e millennium van de menselijke beschaving. ⟡

## 🌍 Werkt écht

- Vraagt locatie (toestemming) voor nauwkeurige zonsopkomst, zonsondergang en alle schemeringen
- Zonder locatie → valt terug op 40° noorderbreedte, 0° oosterlengte
- Maanstand wordt berekend op basis van een referentie-nieuwe-maan (17 april 2026)
- Toont maanfase, symbool en verlichtingspercentage

## 🧩 Technisch

- Pure HTML/CSS/JS – geen externe bibliotheken
- **720 wigjes** (hardcoded in `GradientGenerator`, regel `this.gradientSteps = 720`) voor vloeiende kleurovergangen zonder zichtbare randen
- **HSL-kleurinterpolatie** tussen ankerpunten (diepste nacht, astronomische/náutische/civiele schemering, zonsopgang/ondergang, middagzon)
- Maanfase, wijzers, gradiënt en tracker worden getekend op een HTML5-canvas
- Past zich aan elke schermgrootte aan
- Verloop en maanfase worden één keer per dag berekend en gecached

## 📁 Bestanden

- `index.html` – de klokpagina
- `style.css` – uiterlijk, donker thema
- `astro.js` – astronomische berekeningen (Juliaanse dag, zonspositie, zonsopkomst/ondergang, schemeringen)
- `moonphase.js` – maanfase-berekeningen (fase, verlichting, symbool)
- `clock.js` – alle tekenlogica (gradiënt, maan, wijzerplaat, wijzers, tracker)

## 🚀 Live gebruiken

1. Download de vijf bestanden in één map.
2. Open `index.html` in een moderne browser (Chrome, Firefox, Edge).
3. Geef toestemming voor locatie (voor echte zonsopkomst/ondergang).
4. Klaar – de klok draait.

## 🎨 Configuratie

Alle instellingen staan bovenin `clock.js`:

```javascript
gradientMargin: 25,            // ruimte tussen verloop en streepjes
moonRadiusRatio: 0.33,         // grootte van de maan t.o.v. wijzerplaat
showEveryNthHour: 1,           // elk uur een getal (0,1,2,...,23)
showEveryNthMinute: 5,         // minuutgetallen: elke 5 minuten
gradientOpacity: 0.85,         // helderheid van het dag/nacht-verloop
hourTrackerEnabled: true,      // uurvolger aan/uit

Het aantal wigjes (720, ofwel 0,5° per stap) is vast ingesteld in de GradientGenerator-klasse en kan daar worden aangepast.


# 🕰️ Holocene Clock – 24h counterclockwise, with sun, moon and 10,000 years of history

A remarkable clock that runs **counterclockwise**, displays **24 hours**, and shows the position of sun and moon – based on your location and real astronomy.

See it in action: [to the clock](https://deningenieur.github.io/24-uur-klok/)

## ✨ What makes this clock different?

- **12 o'clock (noon) is at the top**, midnight (0h) at the bottom
- **Counterclockwise** – time moves leftwards
- **Sunrise/sunset** creates a smooth colour gradient on the dial: deep blue night → purple twilights → rosy dawn → warm golden day → orange sunset → and back again
- **Moon phases** displayed in the centre of the dial, including parallactic rotation based on your latitude
- **Holocene calendar** – current year + 10,000 (e.g. 12026 HE)
- **Hour tracker** – a dot that follows the current hour along the edge

## 🔄 Why counterclockwise?

In the southern hemisphere, a horizontal sundial's shadow moves **counterclockwise** because the sun arcs through the northern sky. Most clocks follow the northern convention — this clock follows nature south of the equator.

Throughout history, various cultures have embraced counterclockwise clocks:

- **Testour, Tunisia** — A 17th-century mosque clock runs backwards as a symbol of returning to Al-Andalus after the Inquisition.
- **Jewish clocks** — Mirrored due to Hebrew's right-to-left reading direction.
- **Gujarat, India** — Tribal communities note that Earth, the moon, and water vortices all spin counterclockwise. Nature, they argue, moves this way.

## 🌾 Holocene Era (HE)

Proposed by physicist Cesare Emiliani in 1993, the Holocene calendar adds 10,000 years to the AD/CE year. 2026 → 12026 HE.

Why 10,000? The Holocene Epoch began ~11,700 years ago — when the Ice Age ended, agriculture began, and the first permanent settlements arose. The HE calendar gives us a year zero and anchors time to geology and civilisation, not religion.

⟡ You are living in the 12th millennium of human civilisation. ⟡

## 🌍 It really works

- Requests location (permission) for accurate sunrise, sunset and all twilights
- Without location → falls back to 40°N, 0°E
- Moon phase calculated using a reference new moon (17 April 2026)
- Displays moon phase name, symbol and illumination percentage

## 🧩 Technical

- Pure HTML/CSS/JS – no external libraries
- **720 wedges** (hardcoded in `GradientGenerator`, line `this.gradientSteps = 720`) for smooth colour gradients with no visible banding
- **HSL colour interpolation** between anchor points (deepest night, astronomical/nautical/civil twilight, sunrise/sunset, solar noon)
- Moon phase, hands, gradient and tracker drawn on an HTML5 canvas
- Adapts to any screen size
- Gradient and moon phase calculated once per day and cached

## 📁 Files

- `index.html` – the clock page
- `style.css` – appearance, dark theme
- `astro.js` – astronomical calculations (Julian date, sun position, sunrise/sunset, twilights)
- `moonphase.js` – moon phase calculations (phase, illumination, symbol)
- `clock.js` – all drawing logic (gradient, moon, dial, hands, tracker)

## 🚀 Use it live

1. Download the five files into one folder.
2. Open `index.html` in a modern browser (Chrome, Firefox, Edge).
3. Grant location permission (for real sunrise/sunset times).
4. Done – the clock is running.

## 🎨 Configuration

All settings are at the top of `clock.js`:

```javascript
gradientMargin: 25,            // space between gradient and tick marks
moonRadiusRatio: 0.33,         // moon size relative to dial
showEveryNthHour: 1,           // show every Nth hour number
showEveryNthMinute: 5,         // show minute numbers every 5 min
gradientOpacity: 0.85,         // opacity of the day/night gradient
hourTrackerEnabled: true,      // toggle hour tracker dot

The number of wedges (720, or 0.5° per step) is hardcoded in the GradientGenerator class and can be adjusted there.

