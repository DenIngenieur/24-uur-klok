# 🕰️ Holoceen Klok – 24u linksom, met zon, maan en 10.000 jaar geschiedenis

Een bijzondere klok die **tegen de klok in loopt**, **24 uur** toont, en de stand van de zon en maan laat zien – gebaseerd op jouw locatie en de echte sterrenkunde.

Zie het ding in werking: [naar de klok](https://deningenieur.github.io/24-uur-klok/)

## ✨ Wat maakt deze klok anders?

- **12 uur (middag) staat boven**, middernacht (0 uur) onder
- **Tegen de klok in** – de tijd loopt linksom
- **Zonsopgang / zonsondergang** bepaalt een kleurenverloop op de wijzerplaat (warm geel naar diepblauw)
- **Schijngestalten van de maan** in het midden
- **Holoceen kalender** – huidig jaar + 10.000 (bijv. 12026 HE)
- **Sprongseconden en -minuten** (seconden tikken, minuten en uren bewegen soepel)

## 🌍 Werkt écht

- Vraagt locatie (toestemming) voor nauwkeurige zonsopkomst en -ondergang
- Zonder locatie → valt terug op 40° noorderbreedte (seizoensbewust)
- Maanstand wordt berekend op basis van een referentie-nieuwe-maan (17 april 2026)

## 🧩 Technisch (webversie)

- Pure HTML/CSS/JS – geen extra libraries
- 720 wigjes voor vloeiende kleurovergangen
- Maan en wijzers worden getekend in canvas
- Past zich aan elke schermgrootte aan

## 📁 Bestanden

- `index.html` – de klokpagina
- `style.css` – uiterlijk, donker thema
- `clock.js` – alle rekenlogica (zon, maan, gradiënten)

## 🚀 Live gebruiken

1. Download de drie bestanden in één map.
2. Open `index.html` in een moderne browser (Chrome, Firefox, Edge).
3. Geef toestemming voor locatie (voor echte zonsop/-ondergang).
4. Klaar – de klok draait.

## 🎨 Configuratie

Alle instellingen staan bovenin `clock.js`:

```javascript
gradientMargin: 12,            // ruimte tussen verloop en streepjes
moonSizeRatio: 0.35,           // grootte van de maan t.o.v. wijzerplaat
showEveryNthHour: 2,           // elk 2e uur getal (0,2,4,...)
showEveryNthMinute: 5,         // minuutgetallen: elke 5 minuten
gradientOpacity: 0.95,         // helderheid van het dag/nacht-verloop
useRealDayNight: true          // false = symbolisch verloop (geen locatie nodig)
