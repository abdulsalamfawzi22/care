// ===== خريطة الباص المدمجة (قابلة لإعادة الاستخدام في أي صفحة) =====
// تُحمّل مكتباتها (Leaflet + Firebase) عند الحاجة فقط — تبقى الصفحات خفيفة.
(function () {
  let libsLoaded = false;
  let libsLoading = null;
  const built = {};

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

  function ensureLibs() {
    if (libsLoaded) return Promise.resolve();
    if (libsLoading) return libsLoading;
    libsLoading = (async () => {
      loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js");
      await loadScript("firebase-init.js?v=1");
      libsLoaded = true;
    })();
    return libsLoading;
  }

  // إنشاء خريطة داخل عنصر محدد
  window.initBusMapIn = async function (mapId, statusId, gmapsId) {
    if (built[mapId]) {
      setTimeout(() => built[mapId].invalidateSize(), 100);
      return;
    }
    if (!document.getElementById(mapId)) return;
    built[mapId] = "loading";
    try {
      await ensureLibs();
    } catch (e) {
      const s = document.getElementById(statusId);
      if (s) s.innerHTML = '<span class="dot off"></span> تعذّر تحميل الخريطة';
      built[mapId] = null;
      return;
    }
    buildMap(mapId, statusId, gmapsId);
  };

  // توافق مع النداء القديم (خريطة صفحة الفعاليات)
  window.initBusMap = function () {
    return window.initBusMapIn("event-map", "mapStatus", "gmapsBtn");
  };

  function buildMap(mapId, statusId, gmapsId) {
    const statusEl = document.getElementById(statusId);
    const map = L.map(mapId, { zoomControl: true }).setView([21.42, 39.83], 10);
    built[mapId] = map;
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

    const gmapsBtn = gmapsId && document.getElementById(gmapsId);
    if (gmapsBtn) {
      gmapsBtn.addEventListener("click", () => {
        if (!lastPos) { setStatus("off", "لا يوجد موقع للباص بعد"); return; }
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lastPos[0]},${lastPos[1]}`, "_blank");
      });
    }

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
