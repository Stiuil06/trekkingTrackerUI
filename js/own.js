function loadMap() {
  const map = L.map('map').setView([0, 0], 0);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  return map
}

function fetchJson(trackPath) {
  return new Promise((resolve, reject) => {
    fetch(trackPath)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      resolve(response.json());
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
      reject(error)
    });
  })
}


// Function to calculate distance between two GPS points using Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371.0; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Function to convert degrees to radians
function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

// Function to find the nearest point on the whole.json to the currentPosition.json position
function findNearestPoint(trackPoints, currentPoint) {
  let minDistance = Infinity;
  let nearestPoint = null;
  trackPoints.forEach(point => {
    const distance = haversine(point[0], point[1], currentPoint[0], currentPoint[1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  });
  return nearestPoint;
}

function splitTrackPoints(trackPoints, point) {
  const index = trackPoints.findIndex(p => p === point); // Find the index of the given point
  if (index === -1) {
    console.error("Point not found in trackPoints list.");
    return [trackPoints, []]; // Return original list if point not found
  }
  const pointsBefore = trackPoints.slice(0, index); // Points before the given point
  const pointsAfter = trackPoints.slice(index); // Points after the given point
  return [pointsBefore, pointsAfter];
}

function calculateDistanceBetween (wpt1, wpt2) {
  let latlng1 = {};
  latlng1.lat = wpt1[0];
  latlng1.lon = wpt1[1];
  let latlng2 = {};
  latlng2.lat = wpt2[0];
  latlng2.lon = wpt2[1];
  var rad = Math.PI / 180,
      lat1 = latlng1.lat * rad,
      lat2 = latlng2.lat * rad,
      sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
      sinDLon = Math.sin((latlng2.lon - latlng1.lon) * rad / 2),
      a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

function calculateDistance(points) {
  let distance = {};
  let totalDistance = 0;
  let cumulDistance = [];
  for (var i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistanceBetween(points[i],points[i+1]);
    cumulDistance[i] = totalDistance;
  }
  cumulDistance[points.length - 1] = totalDistance;

  distance.total = totalDistance;
  distance.cumul = cumulDistance;

  return distance;
}

function drawTrack(coordinates, color, weight = 6, description, map) {
  return L.polyline(coordinates, { weight: weight, color: color }).addTo(map).bindPopup(description);
}

function markPointOnMap(position, description, map) {
  return L.marker(position).addTo(map).bindPopup(description);
}

function focusMapOn(point, zoom, map) {
  return map.setView(point, zoom)
}

