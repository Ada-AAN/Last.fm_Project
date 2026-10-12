import { getLocalArtistImage } from './artist-images.js';

const artistName = new URLSearchParams(window.location.search).get('name');
const status = document.querySelector('#profile-status');
const profile = document.querySelector('#artist-profile');

try {
  if (!artistName) {
    throw new Error('No artist name was provided in the page URL.');
  }

  const response = await fetch(`/artistinfo?artist=${encodeURIComponent(artistName)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  const artist = data.artist;
  if (!artist) {
    throw new Error('The server response did not contain artist details.');
  }

  const images = artist.image ?? [];
  const imageURL = getLocalArtistImage(artist.name)
    || ['mega', 'extralarge', 'large']
      .map((size) => images.find((image) => image.size === size && image['#text']))
      .find(Boolean)?.['#text']
    || '';

  document.title = `${artist.name} - Stats Central`;
  profile.querySelector('.artist-profile-name').textContent = artist.name;
  profile.querySelector('.artist-profile-stats').textContent =
    `${Number(artist.stats?.listeners || 0).toLocaleString()} listeners · ` +
    `${Number(artist.stats?.playcount || 0).toLocaleString()} plays`;
  profile.querySelector('.artist-profile-bio').textContent =
    artist.bio?.summary?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'No artist bio is available.';

  const image = profile.querySelector('.artist-profile-image');
  if (imageURL) {
    image.src = imageURL;
    image.alt = `${artist.name} artwork`;
  } else {
    image.hidden = true;
  }

  const lastfmLink = profile.querySelector('.artist-profile-lastfm');
  lastfmLink.href = artist.url;

  status.hidden = true;
  profile.hidden = false;
} catch (error) {
  status.textContent = `Could not load artist profile: ${error.message}`;
  console.error('Could not load artist profile:', error);
}

const albumsContainer = document.querySelector('#artist-albums');

try {
  if (!artistName) {
    throw new Error('No artist name was provided in the page URL.');
  }

  const albumsResponse = await fetch(`/albums?artist=${encodeURIComponent(artistName)}`);
  const albumsData = await albumsResponse.json();

  if (!albumsResponse.ok) {
    throw new Error(albumsData.error || `Request failed: ${albumsResponse.status}`);
  }

  const albums = albumsData.topalbums?.album;
  if (!Array.isArray(albums)) {
    throw new Error('The server response did not contain a list of albums.');
  }

  if (albums.length === 0) {
    albumsContainer.textContent = 'No top albums found for this artist.';
  }

  albums.forEach((album) => {
    const card = document.createElement('article');
    card.className = 'album-card';

    const imageURL =
      album.image?.find((image) => image.size === 'large' && image['#text'])?.['#text']
      || album.image?.find((image) => image['#text'])?.['#text'];

    if (imageURL) {
      const image = document.createElement('img');
      image.src = imageURL;
      image.alt = `${album.name} album cover`;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        image.hidden = true;
      });
      card.appendChild(image);
    }

    const title = document.createElement('p');
    title.textContent = album.name;
    card.appendChild(title);
    albumsContainer.appendChild(card);
  });
} catch (error) {
  albumsContainer.textContent = `Could not load top albums: ${error.message}`;
  console.error('Could not load artist albums:', error);
}
