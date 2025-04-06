const apiKey = '5b3ce3597851110001cf624823a38d16addd49689f204ffefd4554d3';
let map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let fromMarker, toMarker, routeLine;

async function geocodeAddress(address) {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.features.length === 0) throw new Error("Location not found");
  const coords = data.features[0].geometry.coordinates;
  return { lng: coords[0], lat: coords[1] };
}

async function drawRoute(from, to) {
  const body = {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat]
    ]
  };

  const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
  const distance = data.features[0].properties.summary.distance;
  const duration = data.features[0].properties.summary.duration;

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline(coords, { color: 'blue', weight: 4 }).addTo(map);
  map.fitBounds(routeLine.getBounds());

  const distKm = (distance / 1000).toFixed(2);
  const durMin = (duration / 60).toFixed(1);
  document.getElementById('route-info').textContent = `Distance: ${distKm} km | Duration: ${durMin} min`;
}

document.getElementById('bookingForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const departure = document.getElementById('departure').value.trim();
  const arrival = document.getElementById('arrival').value.trim();

  try {
    const from = await geocodeAddress(departure);
    const to = await geocodeAddress(arrival);

    if (fromMarker) map.removeLayer(fromMarker);
    if (toMarker) map.removeLayer(toMarker);

    fromMarker = L.marker([from.lat, from.lng]).addTo(map).bindPopup("From").openPopup();
    toMarker = L.marker([to.lat, to.lng]).addTo(map).bindPopup("To").openPopup();

    await drawRoute(from, to);

    alert('Booking submitted!');
  } catch (err) {
    console.error(err);
    alert("Could not find one or both locations. Please check your input.");
  }
});

// Initialize Flatpickr
flatpickr("#datetime", {
  enableTime: true,
  dateFormat: "Y-m-d H:i",
  time_24hr: true,
  minDate: "today"
});