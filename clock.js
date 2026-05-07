/**
 * 24h COUNTERCLOCKWISE CLOCK - GRADIENT WITH MARGIN
 * 
 * Features:
 * - Gradient confined to inner circle with margin
 * - Clean separation between day/night colors and tick marks
 * - Large moon at center
 * - Hands over moon
 */

// ========== CONFIGURATION ==========
const CONFIG = {
    size: 500,
    showEveryNthHour: 1,
    showEveryNthMinute: 5,
    useRealDayNight: true,
    gradientOpacity: 0.75,
    gradientResolution: 720,
    gradientMargin: 15,              // Pixels between gradient edge and tick marks
    
    // Moon phase configuration
    showMoonPhase: true,
    moonSizeRatio: 0.35,
    
    // Moon phase reference (new moon: 2026-04-17 11:51 UTC)
    referenceNewMoon: {
        year: 2026,
        month: 3,
        day: 17,
        hour: 11,
        minute: 51
    },
    
    // Twilight color palette
    twilightColors: {
        highDay: "#ffea80",
        lowDay: "#ffcc66",
        civilStart: "#ff9955",
        civil: "#cc77aa",
        nautical: "#8855bb",
        astronomical: "#4433aa",
        night: "#0a0a3a",
        noonPeak: "#ffffaa"
    },
    
    moonPhaseColors: {
        lit: "#fff8dc",
        dark: "#2a2a5a",
        shadow: "#6a6a8a",
        rimLight: "#ffeedd"
    },
    
    colors: {
        background: "#0a0e1a",
        dialBorder: "#2a3550",
        marginRing: "#1a1e2e",       // Color of the margin between gradient and ticks
        textDay: "#fff5e0",
        textNight: "#8899bb",
        minuteMarkers: "#ffffff",
        hourHand: "#f0f3ff",
        minuteHand: "#b9c7d9",
        secondHand: "#ff4d6d",
        tickMajor: "#ffffff",
        tickMinor: "#5b6e8c"
    },
    
    handWidths: { hour: 6, minute: 4, second: 2 },
    updateInterval: 250
};

// ========== GLOBALS ==========
let canvas, ctx;
let clockRadius, centerX, centerY;
let gradientRadius;                  // clockRadius - gradientMargin
let moonRadius;
let latitude = 40;
let useRealData = false;
let gradientCache = null;
let cachedDate = null;
let cachedLatitude = null;

const statusEl = document.getElementById("clockStatus").querySelector("span");
const timestampEl = document.getElementById("timestamp");

function updateStatus(msg, isError = false) {
    if (statusEl) {
        statusEl.textContent = msg;
        statusEl.style.color = isError ? "#ffaa88" : "#aaccff";
    }
}

function updateHoloceneTimestamp() {
    if (!timestampEl) return;
    const now = new Date();
    const year = now.getFullYear() + 10000;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    timestampEl.textContent = `HE ${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// ========== ANGLE FUNCTIONS ==========
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(rad) {
    return rad * 180 / Math.PI;
}

function getHourAngle(hourDecimal) {
    return -(hourDecimal * 15) + 90;
}

function angleToHour(angleDegrees) {
    let normalized = angleDegrees % 360;
    if (normalized < 0) normalized += 360;
    let hour = (90 - normalized) / 15;
    if (hour < 0) hour += 24;
    return hour % 24;
}

function getMinuteAngle(decimalMinutes) {
    return -(decimalMinutes * 6) - 90;
}

function getSecondAngle(seconds) {
    return -(seconds * 6) - 90;
}

function getPosition(angleDegrees, radius) {
    const rad = degreesToRadians(angleDegrees);
    return {
        x: centerX + radius * Math.cos(rad),
        y: centerY + radius * Math.sin(rad)
    };
}

function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const decimalHours = hours + minutes/60 + seconds/3600;
    const decimalMinutes = minutes + seconds/60;
    return { hours, minutes, seconds, decimalHours, decimalMinutes };
}

// ========== MOON PHASE CALCULATION ==========
function getMoonPhase() {
    const refDate = new Date(Date.UTC(
        CONFIG.referenceNewMoon.year,
        CONFIG.referenceNewMoon.month,
        CONFIG.referenceNewMoon.day,
        CONFIG.referenceNewMoon.hour,
        CONFIG.referenceNewMoon.minute,
        0
    ));
    
    const now = new Date();
    const diffDays = (now - refDate) / (1000 * 60 * 60 * 24);
    const synodicMonth = 29.53058867;
    
    let phaseAngle = (diffDays / synodicMonth) * 360;
    phaseAngle = phaseAngle % 360;
    if (phaseAngle < 0) phaseAngle += 360;
    
    const illumination = (1 + Math.cos(degreesToRadians(phaseAngle))) / 2;
    const litSideRight = (phaseAngle >= 0 && phaseAngle < 180);
    
    return {
        phaseAngle: phaseAngle,
        illumination: illumination,
        litSideRight: litSideRight
    };
}

function drawMoon() {
    if (!CONFIG.showMoonPhase) return;
    
    const moonData = getMoonPhase();
    const radius = moonRadius;
    const x = centerX;
    const y = centerY;
    
    ctx.save();
    ctx.shadowBlur = 0;
    
    // Draw moon background (dark side) with slight rim light
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = CONFIG.moonPhaseColors.dark;
    ctx.fill();
    
    // Rim light (subtle glow on edge)
    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, 2 * Math.PI);
    ctx.strokeStyle = CONFIG.moonPhaseColors.rimLight;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw lit portion
    if (moonData.illumination > 0.01 && moonData.illumination < 0.99) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.clip();
        
        const offset = radius * (1 - moonData.illumination * 2);
        const direction = moonData.litSideRight ? 1 : -1;
        
        ctx.beginPath();
        ctx.ellipse(
            x + direction * offset, y,
            radius * moonData.illumination * 2,
            radius * 2,
            0, 0, 2 * Math.PI
        );
        ctx.fillStyle = CONFIG.moonPhaseColors.lit;
        ctx.fill();
        
        ctx.restore();
    } else if (moonData.illumination >= 0.99) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = CONFIG.moonPhaseColors.lit;
        ctx.fill();
    }
    
    // Subtle inner shadow for depth
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, 2 * Math.PI);
    ctx.strokeStyle = CONFIG.moonPhaseColors.shadow;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
}

// ========== SUN ALTITUDE CALCULATION ==========
function getJulianDay(date) {
    return (date / 86400000) + 2440587.5;
}

function getSunPosition(date, lat, lon) {
    const julianDay = getJulianDay(date);
    const M = radiansToDegrees(0.98560028 * (julianDay - 2451545) - 3.289);
    const C = 1.914 * Math.sin(degreesToRadians(M)) + 0.020 * Math.sin(degreesToRadians(2 * M));
    const lambda = (M + C + 180) % 360;
    
    const sinDec = Math.sin(degreesToRadians(lambda)) * Math.sin(degreesToRadians(23.44));
    const dec = Math.asin(Math.min(0.999, Math.max(-0.999, sinDec)));
    
    const UTCHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const solarTime = UTCHours + lon / 15;
    const hourAngle = degreesToRadians(15 * (12 - solarTime));
    
    const latRad = degreesToRadians(lat);
    const sinAlt = Math.sin(latRad) * Math.sin(dec) + 
                   Math.cos(latRad) * Math.cos(dec) * Math.cos(hourAngle);
    const altitude = radiansToDegrees(Math.asin(Math.min(0.999, Math.max(-0.999, sinAlt))));
    
    return altitude;
}

// ========== COLOR MAPPING ==========
function interpolateColor(color1, color2, factor) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getColorForAltitude(altitude, isNoon = false) {
    if (isNoon && altitude > 20) {
        return CONFIG.twilightColors.noonPeak;
    }
    
    if (altitude > 10) {
        return CONFIG.twilightColors.highDay;
    } else if (altitude > 0) {
        const factor = (altitude - 0) / 10;
        return interpolateColor(CONFIG.twilightColors.lowDay, CONFIG.twilightColors.highDay, factor);
    } else if (altitude > -2) {
        const factor = (altitude - (-2)) / 2;
        return interpolateColor(CONFIG.twilightColors.civilStart, CONFIG.twilightColors.lowDay, factor);
    } else if (altitude > -6) {
        const factor = (altitude - (-6)) / 4;
        return interpolateColor(CONFIG.twilightColors.civil, CONFIG.twilightColors.civilStart, factor);
    } else if (altitude > -12) {
        const factor = (altitude - (-12)) / 6;
        return interpolateColor(CONFIG.twilightColors.nautical, CONFIG.twilightColors.civil, factor);
    } else if (altitude > -18) {
        const factor = (altitude - (-18)) / 6;
        return interpolateColor(CONFIG.twilightColors.astronomical, CONFIG.twilightColors.nautical, factor);
    } else {
        return CONFIG.twilightColors.night;
    }
}

// ========== GRADIENT GENERATION (with margin) ==========
function generateGradient() {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
    
    const wedgeAngle = 360 / CONFIG.gradientResolution;
    const radius = gradientRadius;  // Use smaller radius for gradient
    const now = new Date();
    
    // Find solar noon
    let noonAltitude = -90;
    let noonHour = 12;
    for (let h = 11; h <= 13; h += 0.1) {
        const testDate = new Date(now);
        testDate.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
        const alt = getSunPosition(testDate, latitude, 0);
        if (alt > noonAltitude) {
            noonAltitude = alt;
            noonHour = h;
        }
    }
    
    for (let i = 0; i < CONFIG.gradientResolution; i++) {
        const startAngle = i * wedgeAngle;
        const endAngle = (i + 1) * wedgeAngle;
        const midAngle = (startAngle + endAngle) / 2;
        
        let hour = angleToHour(midAngle);
        
        const hourDate = new Date(now);
        hourDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
        
        const altitude = getSunPosition(hourDate, latitude, 0);
        const isNearNoon = Math.abs(hour - noonHour) < 0.25;
        
        let color = getColorForAltitude(altitude, isNearNoon);
        
        const opacity = CONFIG.gradientOpacity;
        const rgba = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        let fillColor = color;
        if (rgba) {
            const r = parseInt(rgba[1], 16);
            const g = parseInt(rgba[2], 16);
            const b = parseInt(rgba[3], 16);
            fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        const overlap = 0.3;
        const startRad = degreesToRadians(startAngle - overlap);
        const endRad = degreesToRadians(endAngle + overlap);
        
        offCtx.beginPath();
        offCtx.moveTo(centerX, centerY);
        offCtx.arc(centerX, centerY, radius, startRad, endRad);
        offCtx.closePath();
        offCtx.fillStyle = fillColor;
        offCtx.fill();
    }
    
    return offscreen;
}

function needsGradientUpdate() {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (cachedDate !== currentDate || gradientCache === null || cachedLatitude !== latitude) {
        cachedDate = currentDate;
        cachedLatitude = latitude;
        return true;
    }
    return false;
}

function updateGradientCache() {
    if (canvas && ctx && needsGradientUpdate()) {
        gradientCache = generateGradient();
    }
}

// ========== DRAWING FUNCTIONS ==========
function drawMarginRing() {
    // Draw the neutral margin ring between gradient and ticks
    ctx.beginPath();
    ctx.arc(centerX, centerY, gradientRadius + CONFIG.gradientMargin, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, gradientRadius, 0, 2 * Math.PI);
    ctx.fillStyle = CONFIG.colors.marginRing;
    ctx.fill("evenodd");
}

function drawHand(angleDegrees, lengthRatio, width, color) {
    const pos = getPosition(angleDegrees, clockRadius * lengthRatio);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pos.x, pos.y);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.stroke();
}

function drawTicks() {
    // Ticks start from gradientRadius + margin and go to clockRadius
    const tickStart = gradientRadius + CONFIG.gradientMargin + 2;
    const tickEnd = clockRadius - 2;
    
    for (let h = 0; h < 24; h++) {
        const angle = getHourAngle(h);
        const inner = getPosition(angle, tickStart);
        const outer = getPosition(angle, tickEnd);
        
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.lineWidth = (h % 6 === 0) ? 3 : 1.5;
        ctx.strokeStyle = CONFIG.colors.tickMajor;
        ctx.stroke();
    }
    
    // Minor ticks (every half hour) - shorter
    const minorStart = tickStart + 3;
    for (let h = 0; h < 24; h++) {
        const angle = getHourAngle(h + 0.5);
        const inner = getPosition(angle, minorStart);
        const outer = getPosition(angle, tickEnd - 2);
        
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = CONFIG.colors.tickMinor;
        ctx.stroke();
    }
}

function drawHourNumbers() {
    const textRadius = clockRadius + 18;
    
    for (let h = 0; h < 24; h++) {
        if (h % CONFIG.showEveryNthHour !== 0) continue;
        const angle = getHourAngle(h);
        const pos = getPosition(angle, textRadius);
        
        const now = new Date();
        const hourDate = new Date(now);
        hourDate.setHours(h, 0, 0, 0);
        const altitude = getSunPosition(hourDate, latitude, 0);
        const isDaytime = altitude > 0;
        
        ctx.font = `bold ${Math.floor(clockRadius * 0.08)}px "Segoe UI", monospace`;
        ctx.fillStyle = isDaytime ? CONFIG.colors.textDay : CONFIG.colors.textNight;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(h.toString(), pos.x, pos.y);
    }
}

function drawMinuteMarkers() {
    const markerRadius = clockRadius * 0.68;  // Inside the tick ring
    
    for (let min = 0; min < 60; min++) {
        if (min % CONFIG.showEveryNthMinute !== 0) continue;
        const angle = getMinuteAngle(min);
        const pos = getPosition(angle, markerRadius);
        
        ctx.font = `bold ${Math.floor(clockRadius * 0.05)}px "Segoe UI", monospace`;
        ctx.fillStyle = CONFIG.colors.minuteMarkers;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1.5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(min.toString(), pos.x, pos.y);
        ctx.fillText(min.toString(), pos.x, pos.y);
    }
}

function drawDialBorder() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = CONFIG.colors.dialBorder;
    ctx.stroke();
    
    // Inner border (separates margin from gradient area)
    ctx.beginPath();
    ctx.arc(centerX, centerY, gradientRadius + CONFIG.gradientMargin, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,200,0.2)";
    ctx.stroke();
}

// ========== GEOLOCATION INIT ==========
function initDayNight() {
    if (!CONFIG.useRealDayNight) {
        useRealData = false;
        latitude = 40;
        updateStatus(`🌙 Holocene Era | Twilight at 40°N (fallback)`);
        gradientCache = null;
        return;
    }
    
    if (!navigator.geolocation) {
        updateStatus("📍 No geolocation → using 40°N fallback", true);
        useRealData = false;
        latitude = 40;
        gradientCache = null;
        return;
    }
    
    updateStatus("📍 Requesting location for true twilight zones...");
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            latitude = pos.coords.latitude;
            useRealData = true;
            updateStatus(`🌞 Geolocation 👍️ | Latitude ${latitude.toFixed(1)}°`);
            gradientCache = null;
        },
        (err) => {
            updateStatus("⚠️ Geolocation denied → using 40°N fallback", true);
            useRealData = false;
            latitude = 40;
            gradientCache = null;
        }
    );
}

// ========== MAIN RENDER ==========
function renderClock() {
    if (!ctx) return;
    
    updateHoloceneTimestamp();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CONFIG.colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    updateGradientCache();
    
    if (gradientCache) {
        ctx.drawImage(gradientCache, 0, 0);
    } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, gradientRadius, 0, 2 * Math.PI);
        ctx.fillStyle = "#111625";
        ctx.fill();
    }
    
    // Draw margin ring between gradient and ticks
    drawMarginRing();
    
    drawDialBorder();
    drawTicks();
    drawMinuteMarkers();
    drawHourNumbers();
    
    // Draw moon BEFORE hands
    drawMoon();
    
    const { decimalHours, decimalMinutes, seconds } = getCurrentTime();
    const hourAngle = getHourAngle(decimalHours);
    const minuteAngle = getMinuteAngle(decimalMinutes);
    const secondAngle = getSecondAngle(seconds);
    
    drawHand(hourAngle, 0.38, CONFIG.handWidths.hour, CONFIG.colors.hourHand);
    drawHand(minuteAngle, 0.58, CONFIG.handWidths.minute, CONFIG.colors.minuteHand);
    drawHand(secondAngle, 0.72, CONFIG.handWidths.second, CONFIG.colors.secondHand);
    
    // Tiny center pivot over everything
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = CONFIG.colors.secondHand;
    ctx.shadowBlur = 4;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ========== RESIZE & INIT ==========
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxSize = Math.min(container.clientWidth, window.innerWidth * 0.8, CONFIG.size);
    canvas.style.width = `${maxSize}px`;
    canvas.style.height = `${maxSize}px`;
    canvas.width = CONFIG.size;
    canvas.height = CONFIG.size;
    
    clockRadius = CONFIG.size / 2 - 35;
    centerX = CONFIG.size / 2;
    centerY = CONFIG.size / 2;
    gradientRadius = clockRadius - CONFIG.gradientMargin;
    moonRadius = gradientRadius * CONFIG.moonSizeRatio;
    
    gradientCache = null;
    renderClock();
}

// ========== ANIMATION ==========
let animFrame;
function animate() {
    renderClock();
    animFrame = setTimeout(() => requestAnimationFrame(animate), CONFIG.updateInterval);
}

// ========== START ==========
window.addEventListener("load", () => {
    canvas = document.getElementById("clockCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    
    resizeCanvas();
    initDayNight();
    animate();
    
    window.addEventListener("resize", () => resizeCanvas());
});
