function getSessionId() {
  return fetchText('https://mrbeast.justdev.pl/api/sessionId')
}

class BeastAPIClient {
  apiUrl = 'https://mrbeast.justdev.pl'

  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  getParameters() {
    const url = new URL(this.apiUrl + '/api/parameters.json')
    return fetchJson(url).then(parameters => {
      return parameters.reduce((prev, current) => {
        return (prev.timestamp > current.timestamp) ? prev : current;
      })
    })
  }

  getMessages() {
    const url = new URL(this.apiUrl + '/api/messages.json')
    return fetchJson(url).then(messages => {
      messages.sort((a, b) => b.timestamp - a.timestamp);
      return messages.slice(0, 3);
    })
  }

  getPhotos() {
    const url = new URL(this.apiUrl + '/api/photos.json')
    return fetchJson(url).then(messages => {
      messages.sort((a, b) => b.timestamp - a.timestamp);

      return messages.map(obj => ({
        ...obj,
        filename: this.apiUrl + '/api/' + obj.filename

      })).slice(0, 3);

    })
  }

  getTrackPoints(from = 0) {
    // this.sessionId = 'dc574112-dcb6-45ba-b57f-04b35f5c3662'
    const url = new URL(this.apiUrl + '/trackpoints.php')
    url.searchParams.append('sessionId', this.sessionId)
    url.searchParams.append('from', from)

    return fetchJson(url).then(result => {
      return result.trackPoints
    })
  }

  getCoursePoints() {
    // this.sessionId = 'ae751506-984f-4f53-9c15-d3a5bcd217bd'
    const url = new URL(this.apiUrl + '/coursePoints.php')
    url.searchParams.append('sessionId', this.sessionId)
    return fetchJson(url).then(result => {
      if (result.courses.length > 0) {
        return result.courses[0].coursePoints
      } else {

        return []
      }
    })
  }
}

class UIContext {
  lastContextRefresh //unixTime
  map //openStreetMap
  courseCoordinates
  courseCompletedPart
  courseTodoPart
  courseStartCoordinates
  courseEndCoordinates
  trackPoints
  latestTravelerCoordinates
  heartRateBeatsPerMin
  currentTravelerSpeed
  totalTrackDistance
  totalDistanceTraveled
  remainingDistance
  allFluids
  fluidConsumed
  caloriesBurned

  travelerPointLayerReference
  courseStartPointLayerReference
  courseEndPointLayerReference
  historyTrackLayerReference
  courseLayerReference
  ;

  globalProgress() {
    return this.totalDistanceTraveled / this.totalTrackDistance;
  }
}

function buildContext(uiContext) {
  uiContext.lastContextRefresh = Date.now()
  uiContext.map = null
  uiContext.courseCoordinates = []
  uiContext.courseStartCoordinates = null
  uiContext.courseEndCoordinates = null
  uiContext.trackPoints = []
  uiContext.latestPoint = null
  uiContext.heartRateBeatsPerMin = '?'
  uiContext.currentTravelerSpeed = '?'
  uiContext.totalTrackDistance = '?'
  uiContext.totalDistanceTraveled = '?'
  uiContext.remainingDistance = '?'
  uiContext.allFluids = '?'
  uiContext.fluidConsumed = '?'
  uiContext.caloriesBurned = '?'

  uiContext.historyTrackLayerReference = null
}

function enrichUIContextWithTrackPoints(trackPoints, uiContext) {
  uiContext.trackPoints = uiContext.trackPoints.concat(trackPoints);
  uiContext.trackPoints = uiContext.trackPoints.filter((record, index, self) =>
          index === self.findIndex((r) => (
              r.dateTime === record.dateTime
          ))
  );
  uiContext.trackPoints.sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  uiContext.latestPoint = trackPoints[trackPoints.length - 1]
  uiContext.latestTravelerCoordinates = [uiContext.latestPoint.position.lat.toFixed(
      5), uiContext.latestPoint.position.lon.toFixed(5)]

  uiContext.heartRateBeatsPerMin = uiContext.latestPoint.fitnessPointData.heartRateBeatsPerMin
  uiContext.totalDistanceTraveled = (uiContext.latestPoint.totalDistanceMeters
      * 1000).toFixed(2)
  console.log(uiContext.latestPoint)
  uiContext.currentTravelerSpeed = (uiContext.latestPoint.speed * 3.6).toFixed(
      1)
  uiContext.totalDistanceTraveled = (uiContext.latestPoint.fitnessPointData
      .totalDistanceMeters / 1000).toFixed(2)

  if (uiContext.latestTravelerCoordinates != null) {
    const nearestPoint = findNearestPoint(uiContext.courseCoordinates,
        uiContext.latestTravelerCoordinates);
    const [completedTrackPart, todoTrackPart] = splitTrackPoints(
        uiContext.courseCoordinates, nearestPoint)
    uiContext.courseCompletedPart = completedTrackPart
    uiContext.courseTodoPart = todoTrackPart
    uiContext.remainingDistance = (calculateDistance(todoTrackPart).total
        / 1000).toFixed(2)
  }
}

function enrichUIContextWithCoursePoints(coursePoints, uiContext) {
  uiContext.courseCoordinates = coursePoints.map(
      p => [p.position.lat.toFixed(5), p.position.lon.toFixed(5)])
  uiContext.courseStartCoordinates = uiContext.courseCoordinates[0]
  uiContext.courseEndCoordinates = uiContext.courseCoordinates[uiContext.courseCoordinates.length
  - 1]
  uiContext.totalTrackDistance = (coursePoints[coursePoints.length - 1].distance
      / 1000).toFixed(2)

}

function updateUI(uiContext) {
  updateUIElement('heartRateBeatsPerMin',
      uiContext.heartRateBeatsPerMin + ' BPM')
  updateUIElement('globalProgress',
      (uiContext.globalProgress() * 100).toFixed(2) + ' %')
  updateUIElement('currentTravelerSpeed',
      uiContext.currentTravelerSpeed + ' km/h')

  updateUIElement('totalTrackDistance', uiContext.totalTrackDistance + ' km')
  updateUIElement('totalDistanceTraveled',
      uiContext.totalDistanceTraveled + ' km')
  updateUIElement('remainingDistance', uiContext.remainingDistance + ' km')
  updateUIElement('caloriesBurned', uiContext.caloriesBurned + ' kcal')

  updateUIElement('fluidConsumed',
      uiContext.fluidConsumed + ' L / ' + uiContext.allFluids + ' L')
  updateProgressBar('fluidConsumedBar',
      (uiContext.fluidConsumed / uiContext.allFluids))

  updateUIElement('message1', uiContext.message1)
  updateUIElement('message1time', uiContext.message1time)
  updateUIElement('message2', uiContext.message2)
  updateUIElement('message2time', uiContext.message2time)
  updateUIElement('message3', uiContext.message3)
  updateUIElement('message3time', uiContext.message3time)

  updatePhoto('photo1', uiContext.photo1Src, uiContext.photo1alt)
  updatePhoto('photo2', uiContext.photo2Src, uiContext.photo2alt)
  updatePhoto('photo3', uiContext.photo3Src, uiContext.photo3alt)

  if (uiContext.trackPoints != null) {
    if (uiContext.historyTrackLayerReference != null) {
      uiContext.map.removeLayer(uiContext.historyTrackLayerReference)
    }
    uiContext.historyTrackLayerReference = drawTrack(
        uiContext.trackPoints.map(
            p => [p.position.lat.toFixed(5), p.position.lon.toFixed(5)]),
        '#d6c604',
        3,
        'Real history track.',
        uiContext.map);
  }

  if (uiContext.courseCoordinates.length > 0) {
    if (uiContext.courseLayerReference != null) {
      uiContext.map.removeLayer(uiContext.courseLayerReference)
    }
    if (uiContext.courseStartPointLayerReference != null) {
      uiContext.map.removeLayer(uiContext.courseStartPointLayerReference)
    }
    uiContext.courseStartPointLayerReference = markPointOnMap(
        uiContext.courseStartCoordinates, 'Start', uiContext.map);
    if (uiContext.courseEndPointLayerReference != null) {
      uiContext.map.removeLayer(uiContext.courseEndPointLayerReference)
    }
    uiContext.courseEndPointLayerReference = markPointOnMap(
        uiContext.courseEndCoordinates, 'Meta', uiContext.map);

    if (uiContext.latestTravelerCoordinates != null) {

      uiContext.courseLayerReference = []
      uiContext.courseLayerReference[0] = drawTrack(
          uiContext.courseCompletedPart, 'darkgreen', 6, 'Done track.',
          uiContext.map);
      uiContext.courseLayerReference[1] = drawTrack(uiContext.courseTodoPart,
          'darkred', 6, 'Todo track.', uiContext.map);
    } else {
      uiContext.courseLayerReference = drawTrack(
          uiContext.courseCoordinates,
          'blue',
          6,
          'Planned track.',
          uiContext.map);
    }
  }

  if (uiContext.latestTravelerCoordinates != null) {
    if (uiContext.travelerPointLayerReference != null) {
      uiContext.map.removeLayer(uiContext.travelerPointLayerReference)
    }
    uiContext.travelerPointLayerReference = markPointOnMap(
        uiContext.latestTravelerCoordinates, 'Current Artur location!',
        uiContext.map);
  }
}

function updateUIElement(elementId, value) {
  document.getElementById(elementId).innerText = value;
}

function updatePhoto(photoId, src, alt) {
  if (src) {
    var photo = document.getElementById(photoId);
    photo.src = src
    photo.alt = alt
  }
}

function updateProgressBar(progressBarId, value) {
  document.getElementById(progressBarId).style.width = (value * 100) + '%'
}

function loadMap() {
  const map = L.map('map').setView([0, 0], 0);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  return map
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    fetch(url, {cache: "no-store"})
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

function fetchText(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      resolve(response.text());
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
    const distance = haversine(point[0], point[1], currentPoint[0],
        currentPoint[1]);
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
  const pointsBefore = trackPoints.slice(0, index + 1); // Points before the given point
  const pointsAfter = trackPoints.slice(index); // Points after the given point
  return [pointsBefore, pointsAfter];
}

function calculateDistanceBetween(wpt1, wpt2) {
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
      a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon
          * sinDLon,
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

function calculateDistance(points) {
  let distance = {};
  let totalDistance = 0;
  let cumulDistance = [];
  for (var i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistanceBetween(points[i], points[i + 1]);
    cumulDistance[i] = totalDistance;
  }
  cumulDistance[points.length - 1] = totalDistance;

  distance.total = totalDistance;
  distance.cumul = cumulDistance;

  return distance;
}

function drawTrack(coordinates, color, weight = 6, description, map) {
  if (coordinates.length > 0) {
    return L.polyline(coordinates, {weight: weight, color: color}).addTo(
        map).bindPopup(description);
  } else {
    return null
  }
}

function markPointOnMap(position, description, map) {
  return L.marker(position).addTo(map).bindPopup(description);
}

function focusMapOn(point, zoom, map) {
  return map.setView(point, zoom)
}

function trackLoader(apiClient, uiContext) {
  apiClient.getTrackPoints(0)
  .then(trackPoints => {
    if (trackPoints.length > 0) {
      console.log('trackPoints.length:' + trackPoints.length)
      enrichUIContextWithTrackPoints(trackPoints, uiContext)
      updateUI(uiContext)

      if (uiContext.latestTravelerCoordinates != null) {
        focusMapOn(uiContext.latestTravelerCoordinates, 17, uiContext.map)
      }
    }

    apiClient.getCoursePoints()
    .then(coursePoints => {
      console.log('coursePoints.length:' + coursePoints.length)
      enrichUIContextWithCoursePoints(coursePoints, uiContext)
      updateUI(uiContext)
    })
  })

  setInterval(() => {
    apiClient.getTrackPoints(0)
    .then(trackPoints => {
      if (trackPoints.length > 0) {
        console.log('trackPoints.length:' + trackPoints.length)
        enrichUIContextWithTrackPoints(trackPoints, uiContext)
        updateUI(uiContext)
      }
    })
  }, 10 * 1000)
}

function parametersLoader(apiClient, uiContext) {
  apiClient.getParameters()
  .then(parameters => {
    uiContext.fluidConsumed = parameters.fluids_consumed;
    uiContext.allFluids = parameters.total_fluids;
    uiContext.caloriesBurned = parameters.calories_burned;
    updateUI(uiContext)
  })

  setInterval(() => {
    apiClient.getParameters()
    .then(parameters => {
      uiContext.fluidConsumed = parameters.fluids_consumed;
      uiContext.allFluids = parameters.total_fluids;
      uiContext.caloriesBurned = parameters.calories_burned;
      updateUI(uiContext)
    })
  }, 60 * 1000)
}

function messagesLoader(apiClient, uiContext) {
  apiClient.getMessages()
  .then(messages => {
    uiContext.message1 = messages[0].content;
    uiContext.message1time = timeSince(messages[0].timestamp);
    uiContext.message2 = messages[1].content;
    uiContext.message2time = timeSince(messages[1].timestamp);
    uiContext.message3 = messages[2].content;
    uiContext.message3time = timeSince(messages[2].timestamp);
    updateUI(uiContext)
  })

  setInterval(() => {
    apiClient.getMessages()
    .then(messages => {
      uiContext.message1 = messages[0].content;
      uiContext.message1time = timeSince(messages[0].timestamp);
      uiContext.message2 = messages[1].content;
      uiContext.message2time = timeSince(messages[1].timestamp);
      uiContext.message3 = messages[2].content;
      uiContext.message3time = timeSince(messages[2].timestamp);
      updateUI(uiContext)
    })
  }, 60 * 1000)
}

function photosLoader(apiClient, uiContext) {
  apiClient.getPhotos()
  .then(photos => {
    if (photos.length >= 1) {
      uiContext.photo1alt = photos[0].title
      uiContext.photo1Src = photos[0].filename
    }

    if (photos.length >= 2) {
      uiContext.photo2alt = photos[1].title
      uiContext.photo2Src = photos[1].filename
    }

    if (photos.length >= 3) {
      uiContext.photo3alt = photos[2].title
      uiContext.photo3Src = photos[2].filename
    }
    updateUI(uiContext)
  })
}