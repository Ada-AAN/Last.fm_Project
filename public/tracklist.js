const params = new URLSearchParams(window.location.search);
const artist = params.get('artist');
const albumName = params.get('album');
const genre = params.get('genre');
const title = document.querySelector('#album-title');
const cover = document.querySelector('#album-cover');
const summary = document.querySelector('#album-summary');
const lastfmLink = document.querySelector('#album-lastfm');
const trackList = document.querySelector('#track-list');
const status = document.querySelector('#tracklist-status');
const backLink = document.querySelector('.tracklist-back');
const loader = document.querySelector('.loader');

if (artist) {
  const artistParams = new URLSearchParams({ name: artist });
  if (genre) {
    artistParams.set('genre', genre);
  }
  backLink.href = `/artist.html?${artistParams.toString()}`;
}

if (!artist?.trim() || !albumName?.trim()) {
  loader.hidden = true;
  status.textContent = 'An artist and album must be selected to show a tracklist.';
  status.setAttribute('role', 'alert');
} else {
  title.textContent = albumName;
  document.title = `${albumName} | ${artist} | Records Report`;
  loadAlbum(artist, albumName);
}

async function loadAlbum(artistName, requestedAlbum) {
  try {
    const query = new URLSearchParams({ artist: artistName, album: requestedAlbum });
    const response = await fetch(`/albuminfo?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    const album = data.album;
    if (!album) {
      console.error(`Unexpected album response for "${requestedAlbum}" by "${artistName}":`, data);
      throw new Error('The server response did not contain album details.');
    }

    title.textContent = album.name || requestedAlbum;
    const coverURL = album.image?.find((image) => image.size === 'extralarge' && image['#text'])?.['#text']
      || album.image?.find((image) => image.size === 'large' && image['#text'])?.['#text']
      || album.image?.find((image) => image['#text'])?.['#text'];
    if (coverURL) {
      cover.src = coverURL;
      cover.alt = `${album.name || requestedAlbum} album cover`;
      cover.addEventListener('error', () => {
        cover.hidden = true;
      }, { once: true });
    } else {
      cover.hidden = true;
    }

    summary.textContent = getPlainText(album.wiki?.summary)
      .replace(/Read more on Last\.fm\.?$/i, '')
      .trim()
      || `Explore the tracks from ${album.name || requestedAlbum} by ${artistName}.`;
    lastfmLink.href = album.url;

    const tracks = album.tracks?.track;
    if (!Array.isArray(tracks)) {
      console.error(`Unexpected tracklist for "${requestedAlbum}" by "${artistName}":`, album.tracks);
      throw new Error('The server response did not contain a track list.');
    }

    renderTracks(tracks);
    status.textContent = tracks.length ? '' : 'No tracks were found for this album.';
  } catch (error) {
    console.error(`Could not load "${requestedAlbum}" by "${artistName}":`, error);
    status.textContent = `Could not load the tracklist for ${requestedAlbum}. Please try again later.`;
    status.setAttribute('role', 'alert');
  } finally {
    loader.hidden = true;
  }
}

function getPlainText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  const documentFragment = new DOMParser().parseFromString(value, 'text/html');
  return documentFragment.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function renderTracks(tracks) {
  trackList.replaceChildren();

  tracks.forEach((track, index) => {
    const item = document.createElement('li');
    item.className = 'track-row';

    const number = document.createElement('span');
    number.className = 'track-number';
    number.textContent = `${index + 1}.`;

    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = track.name || 'Untitled track';

    const duration = document.createElement('time');
    duration.className = 'track-duration';
    const seconds = Number(track.duration);
    duration.textContent = formatDuration(seconds);
    if (Number.isFinite(seconds) && seconds > 0) {
      duration.dateTime = `PT${seconds}S`;
    }

    item.append(number, name, duration);
    trackList.appendChild(item);
  });
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--:--';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
