function timeSince(timestamp) {
  // Uzyskaj aktualny czas w Warszawie
  const now = new Date();
  const utcOffset = now.getTimezoneOffset() * 60000; // offset w milisekundach
  const warsawTime = new Date(now.getTime() + utcOffset + (3600000 * 2)); // Dodaj 2 godziny na czas letni w Warszawie

  const seconds = Math.floor((warsawTime - timestamp*1000) / 1000);
  let interval = Math.floor(seconds / 60);

  if (interval < 1) {
    return 'Mniej niż minutę temu';
  }
  if (interval === 1) {
    return '1 minutę temu';
  }
  if (interval < 5) {
    return interval + ' minuty temu';
  }
  if (interval < 60) {
    return interval + ' minut temu';
  }

  interval = Math.floor(interval / 60);
  if (interval === 1) {
    return '1 godzinę temu';
  }
  if (interval < 5) {
    return interval + ' godziny temu';
  }
  if (interval < 24) {
    return interval + ' godzin temu';
  }

  interval = Math.floor(interval / 24);
  if (interval === 1) {
    return '1 dzień temu';
  }
  if (interval < 30) {
    return interval + ' dni temu';
  }

  interval = Math.floor(interval / 30);
  if (interval === 1) {
    return '1 miesiąc temu';
  }
  return interval + ' miesięcy temu';
}