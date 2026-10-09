/* Local, dependency-free orthographic globe. Coastlines: Natural Earth 110m,
   public domain: https://www.naturalearthdata.com/about/terms-of-use/ */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else if (root.document?.querySelector('[data-uap-globe]')) root.UAP_GLOBE = api.createGlobe(root);
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const RAD = Math.PI / 180, TURN = Math.PI * 2;
  const HOME = { lat: 25, lon: -30, zoom: 1 };
  const COLORS = { open: '#a1ffba', resolved: '#afc3b7', contested: '#dac19b' };
  const LABELS = { open: 'Open', resolved: 'Resolved', contested: 'Contested' };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wrap = degrees => ((degrees + 180) % 360 + 360) % 360 - 180;
  function coordinates(record) { return record && typeof record.lat === 'number' && typeof record.lon === 'number' && Number.isFinite(record.lat) && Number.isFinite(record.lon) && Math.abs(record.lat) <= 90 && Math.abs(record.lon) <= 180; }
  function project(lat, lon, centreLat, centreLon) {
    const phi = lat * RAD, delta = (lon - centreLon) * RAD, beta = centreLat * RAD;
    const cosine = Math.cos(phi);
    return { x: cosine * Math.sin(delta), y: Math.cos(beta) * Math.sin(phi) - Math.sin(beta) * cosine * Math.cos(delta), z: Math.sin(beta) * Math.sin(phi) + Math.cos(beta) * cosine * Math.cos(delta) };
  }
  function unproject(x, y, centreLat, centreLon) {
    const squared = x * x + y * y; if (squared > 1) return null;
    const z = Math.sqrt(Math.max(0, 1 - squared)), beta = centreLat * RAD;
    return { lat: Math.asin(clamp(y * Math.cos(beta) + z * Math.sin(beta), -1, 1)) / RAD, lon: wrap(centreLon + Math.atan2(x, z * Math.cos(beta) - y * Math.sin(beta)) / RAD) };
  }
  function horizon(a, b) {
    const t = a.z / (a.z - b.z), x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length, z: 0 };
  }
  function createGlobe(win) {
    const doc = win.document, shell = doc.querySelector('[data-uap-globe]'), canvas = shell?.querySelector('#uap-globe-canvas');
    const context = canvas?.getContext('2d', { alpha: false });
    const output = doc.getElementById('uap-globe-status');
    const empty = { focus() {}, setVisible() {}, destroy() {} };
    if (!shell || !canvas || !context) { if (output) output.textContent = 'The globe is unavailable in this browser. Use the case list to explore the records.'; return empty; }
    const raw = Array.isArray(win.UAP_CASES) ? win.UAP_CASES : [];
    const records = new Map(raw.filter(record => record && typeof record.id === 'string' && record.id.length <= 90 && typeof record.title === 'string').map(record => [record.id, record]));
    let visible = new Set(records.keys()), selected = '', hovered = '', destroyed = false;
    let camera = { ...HOME }, width = 0, height = 0, radius = 0, centreX = 0, centreY = 0, queued = 0, statusTimer = 0;
    let rings = [], landMask = null, raster = null, rasterContext = null, pixels = null, geometry = null, rasterSize = 0;
    let hitPoints = [], lastDown = null, pinch = null, dragged = false;
    const pointers = new Map(), cleanups = [], abort = new win.AbortController();
    canvas.tabIndex = 0;
    if (!canvas.getAttribute('aria-label')) canvas.setAttribute('aria-label', 'Interactive globe of the archive’s UFO cases. Drag to rotate, use arrow keys, plus and minus to zoom, or Home to reset. Choose a case from the accessible list for its evidence.');
    // Canvas is a visual complement. The page's HTML case list supplies each case.
    canvas.setAttribute('role', 'img');
    if (output) { output.setAttribute('role', 'status'); output.setAttribute('aria-live', 'polite'); output.setAttribute('aria-atomic', 'true'); }
    function listen(target, name, callback, options) { target.addEventListener(name, callback, options); cleanups.push(() => target.removeEventListener(name, callback, options)); }
    function positionText() {
      const latitude = Math.abs(camera.lat).toFixed(0) + '°' + (camera.lat >= 0 ? 'N' : 'S');
      const longitude = Math.abs(camera.lon).toFixed(0) + '°' + (camera.lon >= 0 ? 'E' : 'W');
      const mapped = [...records.values()].filter(record => visible.has(record.id) && coordinates(record)).length;
      return 'View centred on ' + latitude + ' / ' + longitude + ' · ' + camera.zoom.toFixed(2) + '× · ' + mapped + ' mapped case' + (mapped === 1 ? '' : 's');
    }
    function announce(text) { if (output && !destroyed) output.textContent = text || positionText(); }
    function announceLater() { win.clearTimeout(statusTimer); statusTimer = win.setTimeout(() => announce(), 180); }
    function screen(point) { return { x: centreX + point.x * radius, y: centreY - point.y * radius, z: point.z }; }
    function rotate(deltaLon, deltaLat) { camera.lon = wrap(camera.lon + deltaLon); camera.lat = clamp(camera.lat + deltaLat, -85, 85); redraw(); }
    function zoom(value) { camera.zoom = clamp(value, .82, 2.25); redraw(); announceLater(); updateControls(); }
    function updateControls() {
      shell.querySelectorAll('[data-globe-zoom]').forEach(button => { const inward = button.dataset.globeZoom === 'in'; button.disabled = inward ? camera.zoom >= 2.25 : camera.zoom <= .82; });
    }
    function reset() { camera = { ...HOME }; hovered = ''; selected = ''; updateControls(); redraw(); announce(); }
    function traceLine(line) {
      if (line.length < 2) return;
      let previous = project(line[0][1], line[0][0], camera.lat, camera.lon);
      for (let i = 1; i < line.length; i++) {
        const next = project(line[i][1], line[i][0], camera.lat, camera.lon);
        if (previous.z >= 0 || next.z >= 0) {
          const start = screen(previous.z >= 0 ? previous : horizon(previous, next));
          const finish = screen(next.z >= 0 ? next : horizon(previous, next));
          context.moveTo(start.x, start.y); context.lineTo(finish.x, finish.y);
        }
        previous = next;
      }
    }
    function prepareMask(world) {
      const map = doc.createElement('canvas'); map.width = 720; map.height = 360;
      const mapContext = map.getContext('2d', { willReadFrequently: true }); if (!mapContext) return;
      mapContext.fillStyle = '#fff';
      for (const ring of world) {
        const polar = ring.some(point => point[1] < -89);
        const unwrapped = []; let previous;
        for (const point of ring) {
          let lon = point[0];
          if (!polar && previous !== undefined) { while (lon - previous > 180) lon -= 360; while (lon - previous < -180) lon += 360; }
          previous = lon; unwrapped.push([lon, point[1]]);
        }
        for (const offset of [-360, 0, 360]) {
          mapContext.beginPath();
          unwrapped.forEach((point, index) => { const x = (point[0] + offset + 180) * 2, y = (90 - point[1]) * 2; if (index) mapContext.lineTo(x, y); else mapContext.moveTo(x, y); });
          mapContext.closePath(); mapContext.fill();
        }
      }
      landMask = mapContext.getImageData(0, 0, 720, 360).data;
    }
    function prepareRaster(size) {
      rasterSize = size; raster = doc.createElement('canvas'); raster.width = size; raster.height = size;
      rasterContext = raster.getContext('2d'); if (!rasterContext) return;
      pixels = rasterContext.createImageData(size, size); geometry = new Float32Array(size * size * 4);
      const half = size / 2;
      for (let row = 0; row < size; row++) for (let column = 0; column < size; column++) {
        const x = (column + .5 - half) / half, y = (half - row - .5) / half, square = x * x + y * y, index = (row * size + column) * 4;
        geometry[index] = x; geometry[index + 1] = y; geometry[index + 2] = square > 1 ? -1 : Math.sqrt(1 - square);
        geometry[index + 3] = .23 + .77 * Math.max(0, -.38 * x + .44 * y + .82 * Math.max(0, geometry[index + 2]));
      }
    }
    function drawSphere() {
      const gradient = context.createRadialGradient(centreX - radius * .38, centreY - radius * .4, radius * .05, centreX, centreY, radius);
      gradient.addColorStop(0, '#132d21'); gradient.addColorStop(.75, '#0b1c15'); gradient.addColorStop(1, '#06100c');
      context.beginPath(); context.arc(centreX, centreY, radius, 0, TURN); context.fillStyle = gradient; context.fill();
      if (landMask && pixels && rasterContext && geometry) {
        const beta = camera.lat * RAD, sine = Math.sin(beta), cosine = Math.cos(beta), lambda = camera.lon * RAD;
        const buffer = pixels.data;
        for (let i = 0; i < geometry.length; i += 4) {
          const z = geometry[i + 2]; if (z < 0) continue;
          const x = geometry[i], y = geometry[i + 1], strength = geometry[i + 3];
          const lat = Math.asin(clamp(y * cosine + z * sine, -1, 1));
          let lon = lambda + Math.atan2(x, z * cosine - y * sine); lon = ((lon + Math.PI) % TURN + TURN) % TURN - Math.PI;
          const column = clamp(Math.floor((lon + Math.PI) / TURN * 720), 0, 719), row = clamp(Math.floor((Math.PI / 2 - lat) / Math.PI * 360), 0, 359);
          const land = landMask[(row * 720 + column) * 4 + 3] > 110;
          buffer[i] = Math.round((land ? 29 : 10) * strength);
          buffer[i + 1] = Math.round((land ? 83 : 30) * strength);
          buffer[i + 2] = Math.round((land ? 47 : 23) * strength);
          buffer[i + 3] = 255;
        }
        rasterContext.putImageData(pixels, 0, 0);
        context.imageSmoothingEnabled = true; context.drawImage(raster, centreX - radius, centreY - radius, radius * 2, radius * 2);
      }
    }
    function drawMesh() {
      context.beginPath(); context.lineWidth = .6; context.strokeStyle = '#93d5a521';
      for (let latitude = -60; latitude <= 60; latitude += 30) { const line = []; for (let longitude = -180; longitude <= 180; longitude += 4) line.push([longitude, latitude]); traceLine(line); }
      for (let longitude = -180; longitude < 180; longitude += 30) { const line = []; for (let latitude = -90; latitude <= 90; latitude += 3) line.push([longitude, latitude]); traceLine(line); }
      context.stroke();
      context.beginPath(); context.lineWidth = .85; context.strokeStyle = '#a1ffba60'; rings.forEach(traceLine); context.stroke();
    }
    function marker(point, record, active) {
      const color = COLORS[record.statusKey] || COLORS.open, scale = active ? 1.2 : 1;
      context.save(); context.translate(point.x, point.y); context.globalAlpha = active ? 1 : clamp(.4 + point.z * .7, .42, 1);
      if (active) { context.beginPath(); context.arc(0, 0, 13, 0, TURN); context.fillStyle = color + '13'; context.fill(); context.strokeStyle = color + '99'; context.lineWidth = 1; context.stroke(); context.beginPath(); context.arc(0, 0, 19, 0, TURN); context.setLineDash([2, 5]); context.strokeStyle = color + '55'; context.stroke(); context.setLineDash([]); }
      context.strokeStyle = color; context.fillStyle = record.statusKey === 'resolved' ? '#102319' : color; context.lineWidth = 1.3;
      context.beginPath();
      if (record.statusKey === 'contested') { context.moveTo(0, -5 * scale); context.lineTo(5 * scale, 4 * scale); context.lineTo(-5 * scale, 4 * scale); context.closePath(); }
      else if (record.statusKey === 'resolved') { context.moveTo(0, -4.5 * scale); context.lineTo(4.5 * scale, 0); context.lineTo(0, 4.5 * scale); context.lineTo(-4.5 * scale, 0); context.closePath(); }
      else context.arc(0, 0, 3.5 * scale, 0, TURN);
      context.fill(); context.stroke(); context.restore();
    }
    function fitText(text, maximum) { let value = String(text).replace(/[\r\n\t]/g, ' ').slice(0, 150); if (context.measureText(value).width <= maximum) return value; while (value.length > 2 && context.measureText(value + '…').width > maximum) value = value.slice(0, -1); return value + '…'; }
    function label(pin) {
      const record = pin.record, maximum = Math.min(226, width - 48), top = pin.y < height * .33 ? pin.y + 23 : pin.y - 78;
      context.font = '12px "Space Grotesk", sans-serif'; const title = fitText(record.title, maximum - 24);
      context.font = '8px "IBM Plex Mono", monospace'; const detail = fitText((LABELS[record.statusKey] || 'Open') + ' / ' + (record.region || 'Case location'), maximum - 24);
      const precision = fitText('LOCATION / ' + String(record.locationPrecision || 'approximate').toUpperCase(), maximum - 24);
      const boxWidth = Math.min(maximum, Math.max(context.measureText(detail).width + 26, context.measureText(precision).width + 26, 150));
      const x = clamp(pin.x > width * .58 ? pin.x - boxWidth - 22 : pin.x + 22, 12, width - boxWidth - 12), y = clamp(top, 42, height - 88);
      context.beginPath(); context.moveTo(pin.x, pin.y); context.lineTo(x < pin.x ? x + boxWidth : x, y + 31); context.strokeStyle = '#a1ffba80'; context.lineWidth = .8; context.stroke();
      context.fillStyle = '#07120ef2'; context.fillRect(x, y, boxWidth, 66); context.strokeStyle = '#69977788'; context.strokeRect(x + .5, y + .5, boxWidth, 66);
      context.fillStyle = '#e6ece4'; context.font = '12px "Space Grotesk", sans-serif'; context.fillText(fitText(title, boxWidth - 24), x + 12, y + 21);
      context.fillStyle = COLORS[record.statusKey] || COLORS.open; context.font = '8px "IBM Plex Mono", monospace'; context.fillText(fitText(detail, boxWidth - 24), x + 12, y + 39);
      context.fillStyle = '#a2b0a6'; context.font = '7px "IBM Plex Mono", monospace'; context.fillText(fitText(precision, boxWidth - 24), x + 12, y + 54);
    }
    function draw() {
      queued = 0; if (destroyed || !width || !height) return;
      radius = Math.min(width * .405, height * .415) * camera.zoom; centreX = width / 2; centreY = height / 2 + 3;
      context.fillStyle = '#070b09'; context.fillRect(0, 0, width, height);
      context.save(); context.beginPath(); context.arc(centreX, centreY, radius, 0, TURN); context.shadowBlur = 36; context.shadowColor = '#83efae24'; context.fillStyle = '#10271a'; context.fill(); context.restore();
      context.save(); context.beginPath(); context.arc(centreX, centreY, radius, 0, TURN); context.clip(); drawSphere(); drawMesh(); context.restore();
      context.beginPath(); context.arc(centreX, centreY, radius, 0, TURN); context.strokeStyle = '#a1ffba66'; context.lineWidth = .8; context.stroke();
      context.fillStyle = '#8eaa98'; context.font = '8px "IBM Plex Mono", monospace'; context.fillText('WORLD VIEW / CASE LOCATIONS', 20, 26);
      context.textAlign = 'right'; context.fillStyle = '#a1ffba'; context.fillText(camera.zoom.toFixed(2) + '×', width - 20, 26); context.textAlign = 'left';
      hitPoints = [];
      for (const record of records.values()) {
        if (!visible.has(record.id) || !coordinates(record)) continue;
        const globe = project(record.lat, record.lon, camera.lat, camera.lon); if (globe.z < .012) continue;
        const point = screen(globe); if (point.x < -20 || point.x > width + 20 || point.y < -20 || point.y > height + 20) continue;
        hitPoints.push({ ...point, record });
      }
      hitPoints.sort((a, b) => a.z - b.z); hitPoints.filter(pin => pin.record.id !== selected && pin.record.id !== hovered).forEach(pin => marker(pin, pin.record, false));
      const chosen = hitPoints.find(pin => pin.record.id === selected), over = hitPoints.find(pin => pin.record.id === hovered);
      if (chosen) marker(chosen, chosen.record, true);
      if (over && over !== chosen) marker(over, over.record, true);
      const highlighted = over || chosen; if (highlighted) label(highlighted);
      context.fillStyle = '#748c7b'; context.font = '8px "IBM Plex Mono", monospace';
      context.fillText('DRAG TO ROTATE / SELECT A MARKER', 20, height - 19);
    }
    function redraw() { if (!queued && !destroyed) queued = win.requestAnimationFrame(draw); }
    function resize() {
      const box = canvas.getBoundingClientRect(); width = Math.round(box.width); height = Math.round(box.height);
      const ratio = Math.min(win.devicePixelRatio || 1, 2); canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio)); context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const size = width < 600 ? 320 : 440; if (size !== rasterSize) prepareRaster(size); redraw();
    }
    function point(event) { const box = canvas.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; }
    function hit(position) {
      return hitPoints.map(pin => ({ pin, distance: Math.hypot(position.x - pin.x, position.y - pin.y) })).filter(item => item.distance <= 13).sort((a, b) => a.distance - b.distance || b.pin.z - a.pin.z)[0]?.pin;
    }
    function select(id) { if (!records.has(id)) return; selected = id; hovered = ''; redraw(); announce('Selected ' + records.get(id).title + '. Its evidence appears in the case panel.'); doc.dispatchEvent(new win.CustomEvent('uap-select', { detail: { id } })); }
    function pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const p = point(event); pointers.set(event.pointerId, p); canvas.setPointerCapture(event.pointerId); canvas.classList.add('uap-is-dragging');
      if (pointers.size === 1) { lastDown = { ...p }; dragged = false; }
      if (pointers.size === 2) { const values = [...pointers.values()]; pinch = { distance: Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y), zoom: camera.zoom }; dragged = true; }
      event.preventDefault();
    }
    function pointerMove(event) {
      const p = point(event), previous = pointers.get(event.pointerId);
      if (previous) {
        pointers.set(event.pointerId, p);
        if (pointers.size > 1 && pinch) { const values = [...pointers.values()]; if (pinch.distance > 5) zoom(pinch.zoom * Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y) / pinch.distance); }
        else { if (lastDown && Math.hypot(p.x - lastDown.x, p.y - lastDown.y) > 5) dragged = true; rotate(-(p.x - previous.x) * .3 / camera.zoom, (p.y - previous.y) * .24 / camera.zoom); }
        hovered = ''; event.preventDefault();
      } else if (event.pointerType !== 'touch') { const next = hit(p)?.record.id || ''; if (next !== hovered) { hovered = next; canvas.style.cursor = next ? 'pointer' : 'grab'; redraw(); } }
    }
    function pointerUp(event) {
      if (!pointers.has(event.pointerId)) return;
      const p = point(event), click = !dragged && pointers.size === 1; pointers.delete(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) { canvas.classList.remove('uap-is-dragging'); lastDown = null; if (click && event.type !== 'pointercancel') { const pin = hit(p); if (pin) select(pin.record.id); else announce(); } else announce(); }
    }
    listen(canvas, 'pointerdown', pointerDown); listen(canvas, 'pointermove', pointerMove); listen(canvas, 'pointerup', pointerUp); listen(canvas, 'pointercancel', pointerUp);
    listen(canvas, 'pointerleave', () => { if (!pointers.size) { hovered = ''; redraw(); } });
    listen(canvas, 'wheel', event => { event.preventDefault(); zoom(camera.zoom * Math.exp(-clamp(event.deltaY, -100, 100) * .002)); }, { passive: false });
    listen(canvas, 'keydown', event => {
      let handled = true;
      if (event.key === 'ArrowLeft') rotate(-8, 0); else if (event.key === 'ArrowRight') rotate(8, 0); else if (event.key === 'ArrowUp') rotate(0, 6); else if (event.key === 'ArrowDown') rotate(0, -6);
      else if (event.key === '+' || event.key === '=') zoom(camera.zoom * 1.15); else if (event.key === '-' || event.key === '_') zoom(camera.zoom / 1.15); else if (event.key === 'Home' || event.key === '0') reset();
      else if ((event.key === 'Enter' || event.key === ' ') && (hovered || selected)) select(hovered || selected); else handled = false;
      if (handled) { event.preventDefault(); announceLater(); }
    });
    shell.querySelectorAll('[data-globe-zoom]').forEach(button => listen(button, 'click', () => zoom(camera.zoom * (button.dataset.globeZoom === 'in' ? 1.18 : 1 / 1.18))));
    shell.querySelectorAll('[data-globe-reset]').forEach(button => listen(button, 'click', reset));
    let observer;
    if (win.ResizeObserver) { observer = new win.ResizeObserver(resize); observer.observe(canvas); } else listen(win, 'resize', resize);
    // No autoplay, inertial rotation or pulsing loop: motion stops with the input.
    // Reduced-motion and the site's paused mode therefore need no extra timer.
    listen(doc, 'visibilitychange', () => { if (doc.hidden && queued) { win.cancelAnimationFrame(queued); queued = 0; } else if (!doc.hidden) redraw(); });
    resize(); updateControls(); announce();
    win.fetch('/assets/uap-world.json', { signal: abort.signal }).then(response => { if (!response.ok) throw Error('Coastline data unavailable'); return response.json(); }).then(world => {
      if (destroyed || !Array.isArray(world.rings) || world.rings.length > 500) return;
      rings = world.rings.filter(ring => Array.isArray(ring) && ring.length < 15000 && ring.every(p => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90));
      prepareMask(rings); redraw();
    }).catch(error => { if (!destroyed && error.name !== 'AbortError') announce(positionText() + ' · Coastlines unavailable; markers and controls still work.'); });
    const api = {
      focus(id) {
        const record = records.get(id); if (!record || destroyed) return false;
        selected = id; hovered = '';
        if (coordinates(record)) { camera.lat = clamp(record.lat, -85, 85); camera.lon = wrap(record.lon); redraw(); announce(record.title + ' · ' + (record.locationPrecision || 'Approximate location') + ' · ' + (visible.has(id) ? 'Selected on the globe.' : 'Marker hidden by the current filter.')); }
        else { redraw(); announce(record.title + ' has no reliable coordinates. No marker is placed.'); }
        return true;
      },
      setVisible(ids) {
        if (destroyed) return;
        visible = ids == null ? new Set(records.keys()) : new Set([...ids].filter(id => records.has(id)));
        hovered = ''; redraw(); announce();
      },
      destroy() {
        if (destroyed) return; destroyed = true; abort.abort(); observer?.disconnect(); cleanups.forEach(remove => remove());
        win.cancelAnimationFrame(queued); win.clearTimeout(statusTimer); pointers.clear(); canvas.classList.remove('uap-is-dragging');
      }
    };
    return api;
  }
  return { project, unproject, horizon, coordinates, wrap, createGlobe };
});
