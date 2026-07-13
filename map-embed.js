// ===== خريطة الباص المدمجة في صفحة الفعاليات =====
// تُحمّل مكتباتها (Leaflet + Firebase) فقط عند فتح الصفحة الثانية — تبقى صفحة العد خفيفة.
(function () {
  let loaded = false;
  let loading = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }
  function ar(n) {
    return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  }

  window.initBusMap = async function () {
    if (loaded) {
      if (window._busMap) setTimeout(() => window._busMap.invalidateSize(), 100);
      return;
    }
    if (loading) return;
    loading = true;
    try {
      loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js");
      await loadScript("firebase-init.js?v=1");
      loaded = true;
      buildMap();
    } catch (e) {
      const s = document.getElementById("mapStatus");
      if (s) s.innerHTML = '<span class="dot off"></span> تعذّر تحميل الخريطة';
    }
  };

  function buildMap() {
    const statusEl = document.getElementById("mapStatus");
    const map = L.map("event-map", { zoomControl: true }).setView([21.42, 39.83], 10);
    window._busMap = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const busIcon = L.divIcon({ className: "bus-marker", html: "🚌", iconSize: [40, 40], iconAnchor: [20, 20] });
    let marker = null, firstFix = true, lastUpdated = 0, lastPos = null;

    function setStatus(cls, t) {
      if (statusEl) statusEl.innerHTML = `<span class="dot ${cls}"></span> ${t}`;
    }

    window.busRef.on("value", (snap) => {
      const d = snap.val();
      if (!d || typeof d.lat !== "number") {
        setStatus("off", "الباص غير نشط حالياً");
        return;
      }
      lastUpdated = d.updated || Date.now();
      lastPos = [d.lat, d.lng];
      if (!marker) marker = L.marker(lastPos, { icon: busIcon }).addTo(map);
      else marker.setLatLng(lastPos);
      if (firstFix) { map.setView(lastPos, 15); firstFix = false; }
    });

    setInterval(() => {
      if (!lastPos) return;
      const age = Math.round((Date.now() - lastUpdated) / 1000);
      if (age <= 45) {
        setStatus("on", `الباص نشط 🟢 — آخر تحديث قبل <span style="direction:ltr;display:inline-block">${ar(Math.max(age, 0))}</span> ث`);
      } else {
        const m = Math.floor(age / 60);
        setStatus("off", `الباص غير نشط — آخر ظهور قبل <span style="direction:ltr;display:inline-block">${m >= 1 ? ar(m) + " د" : ar(age) + " ث"}</span>`);
      }
    }, 1000);

    setTimeout(() => map.invalidateSize(), 250);
  }
})();
