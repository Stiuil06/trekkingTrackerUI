## Traveler
### Position
GET `/api/traveler/currentPosition.json`
```json
{
  "dateTime": "2024-04-11T12:24:04.000Z",
  "position": {
    "lat": 43.91929,
    "lon": 15.58301
  },
  "altitude": 245.04
}
```
GET `/api/traveler/positionHistory.json`
```json
[
  {
    "dateTime": "2024-04-11T11:44:04.000Z",
    "position": {
      "lat": 44.09929,
      "lon": 15.35701
    },
    "altitude": 275.04
  },
  {
    "dateTime": "2024-04-11T11:54:04.000Z",
    "position": {
      "lat": 44.10029,
      "lon": 15.35801
    },
    "altitude": 265.04
  },
...
]
```

### HeartRate
GET `/api/traveler/currentHeartRateBeatsPerMin.json`
```json
{
  "heartRateBeatsPerMin": 80,
  "dateTime": "2024-04-11T12:14:04.000Z"
}
```
GET `/api/traveler/heartRateBeatsPerMinHistory.json`
```json
[
  {
    "heartRateBeatsPerMin": 72,
    "dateTime": "2024-04-11T11:44:04.000Z"
  },
  {
    "heartRateBeatsPerMin": 80,
    "dateTime": "2024-04-11T11:54:04.000Z"
  },
...
]
```




## Track
GET `/api/track/whole.json`
```json
[
  [
    "44.09829",
    "15.35601"
  ],
  [
    "44.09822",
    "15.35614"
  ],
  ... ,
  [
    "43.91993",
    "15.58249"
  ],
  [
    "43.91968",
    "15.58263"
  ]
]
```
GET `/api/track/completed.json`
```json
[
  [
    "44.09829",
    "15.35601"
  ],
  [
    "44.09822",
    "15.35614"
  ],
  ...
]
```
GET `/api/track/todo.json`
```json
[
  ... ,
  [
    "43.91993",
    "15.58249"
  ],
  [
    "43.91968",
    "15.58263"
  ]
]
```