import { getArtistImage } from './listings.js';
import { getLocalArtistImage } from './artist-images.js';

const genreName = new URLSearchParams(window.location.search).get('genre');
const title = document.querySelector('#genre-name');
const grid = document.querySelector('.artist-grid');
const status = document.querySelector('#top-artists-status');
const loader = document.querySelector('.loader');
const credits = document.querySelector('#image-credits');
const creditList = credits.querySelector('ul');

if (!genreName?.trim()) {
  loader.hidden = true;
  status.textContent = 'A genre must be selected to show its top artists.';
  status.setAttribute('role', 'alert');
} else {
  title.textContent = genreName;
  document.title = `Top Artists in ${genreName} | Records Report`;
  loadTopArtists(genreName);
}

async function loadTopArtists(genre) {
  status.textContent = 'Loading top artists...';

  try {
    const response = await fetch(`/artists?tag=${encodeURIComponent(genre)}&limit=12`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed: ${response.status}`);
    }

    const artists = data.topartists?.artist;
    if (!Array.isArray(artists)) {
      console.error(`Unexpected artist response for "${genre}":`, data);
      throw new Error('The server response did not contain an artists list.');
    }

    renderArtists(artists.slice(0, 12), genre);
    status.textContent = artists.length ? '' : `No top artists were found for ${genre}.`;
  } catch (error) {
    console.error(`Could not fetch top artists for "${genre}":`, error);
    status.textContent = `Could not load top artists for ${genre}. Please try again later.`;
    status.setAttribute('role', 'alert');
  }
  finally {
    loader.hidden = true;
  }
}

function renderArtists(artists, genre) {
  const imageCredits = new Set();

  grid.replaceChildren();
  creditList.replaceChildren();
  credits.hidden = true;

  artists.forEach((artist, index) => {
    const card = document.createElement('article');
    card.className = `artist-card${index === 0 ? ' artist-card-featured' : ''}`;

    const link = document.createElement('a');
    link.className = 'artist-card-link';
    link.href = `/artist.html?name=${encodeURIComponent(artist.name)}&genre=${encodeURIComponent(genre)}`;
    link.setAttribute('aria-label', `View ${artist.name}'s artist profile`);

    const imageFrame = document.createElement('span');
    imageFrame.className = 'artist-card-image-frame';

    const imageURL = getArtistImage(artist);
    if (imageURL) {
      const image = document.createElement('img');
      image.className = 'artist-card-image';
      image.src = imageURL;
      image.alt = `${artist.name}, top artist in ${genre}`;
      image.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) {
        image.fetchPriority = 'high';
      }
      image.addEventListener('error', () => {
        image.remove();
      });
      imageFrame.appendChild(image);
    }

    const name = document.createElement('span');
    name.className = 'artist-card-name';
    name.textContent = artist.name;

    link.append(imageFrame, name);
    card.appendChild(link);
    grid.appendChild(card);

    if (!getLocalArtistImage(artist.name) && !imageCredits.has(artist.name)
      && artist.wikipediaImage?.page) {
      imageCredits.add(artist.name);
      const credit = document.createElement('li');
      const artistName = document.createElement('span');
      artistName.textContent = `${artist.name}: `;

      const source = document.createElement('a');
      source.href = artist.wikipediaImage.page;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Wikipedia';

      credit.append(artistName, source);
      creditList.appendChild(credit);
      credits.hidden = false;
    }
  });
}
