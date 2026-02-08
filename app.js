let map;
let infoWindow;
let markers = [];
let markerObjects = [];

window.initMap = async function initMap() {
  // 1) Create the map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20, lng: 0 },
    zoom: 2,
    minZoom: 2,
    maxZoom: 14,
    mapId: "168cc691236d2baa54e54b85",
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
  });

  infoWindow = new google.maps.InfoWindow();

  // 2) Load marker data
  const res = await fetch("./markers.json");
  markers = await res.json();

  // 3) Create markers
  markerObjects = markers.map((m) => {
    const marker = new google.maps.Marker({
      position: { lat: m.lat, lng: m.lng },
      title: m.name,
       icon: "./assets/marker.svg",
    });

    marker.addListener("click", () => {
      infoWindow.setContent(makeInfoHtml(m));
      infoWindow.open(map, marker);
    });

    return marker;
  });

  // 4) Cluster bubbles
  // Uses official library (no build tool needed)
const clusterer = new markerClusterer.MarkerClusterer({
  map,
  markers: markerObjects
});

  // 5) Search UI
  setupSearch();
  setupMobileSheet();
  renderResults(markers);

};

function makeInfoHtml(m) {
  const btn = m.link
    ? `<div style="margin-top:10px"><a href="${escapeAttr(m.link)}" target="_blank" rel="noreferrer"
         style="display:inline-block;background:#f6e300;color:#0b1b4c;font-weight:800;text-decoration:none;
         padding:10px 12px;border-radius:6px">Find out more</a></div>`
    : "";

  return `
    <div style="max-width:320px">
      <div style="font-weight:900;color:#0b1b4c;font-size:16px">${escapeHtml(m.name)}</div>
      <div style="margin-top:8px;font-size:14px;line-height:1.4">${m.notesHtml || ""}</div>
      ${btn}
    </div>
  `;
}

function setupSearch() {
  const input = document.getElementById("search");
  const clear = document.getElementById("clear");

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q
      ? markers
      : markers.filter(m =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.group || "").toLowerCase().includes(q) ||
          (m.tags || []).join(",").toLowerCase().includes(q)
        );
    renderResults(filtered);
  });

  clear.addEventListener("click", () => {
    input.value = "";
    renderResults(markers);
    input.focus();
  });

  // Set this to your real “Form a Club” page later:
  document.getElementById("formClub").href = "https://www.lcfc.com/";
}
function setupMobileSheet() {
  const sheet = document.getElementById("sheet");
  const toggle = document.getElementById("sheetToggle");
  const input = document.getElementById("search");

  if (!sheet || !toggle || !input) return;

  toggle.addEventListener("click", () => {
    sheet.classList.toggle("is-open");
    if (sheet.classList.contains("is-open")) {
      setTimeout(() => input.focus(), 50);
    }
  });

  // Close sheet when tapping outside (mobile only)
  document.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) return;
    if (!sheet.contains(e.target)) sheet.classList.remove("is-open");
  });
}

function renderResults(list) {
  const el = document.getElementById("results");
  el.innerHTML = "";

  list.slice(0, 200).forEach(m => {
    const row = document.createElement("div");
    row.className = "result";
    row.innerHTML = `
      <div class="name">${escapeHtml(m.name)}</div>
      <div class="meta">${escapeHtml(m.group || "")}</div>
    `;

    row.addEventListener("click", () => {
      const pos = { lat: m.lat, lng: m.lng };
      map.panTo(pos);
      map.setZoom(Math.max(map.getZoom(), 6));

      // close sheet only after selection on mobile
      if (window.matchMedia("(max-width: 768px)").matches) {
        document.getElementById("sheet")?.classList.remove("is-open");
      }
    });

    el.appendChild(row);
  });
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]
  ));
}
function escapeAttr(s){ return escapeHtml(s).replace(/"/g, "&quot;"); }
