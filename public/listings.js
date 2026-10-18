
import { getLocalArtistImage } from './artist-images.js';

const createListings = (musicTypes) => {
  const main = document.querySelector('main');
  const credits = document.querySelector('#image-credits');
  const creditList = credits.querySelector('ul');
  const creditedArtists = new Set();

  main.innerHTML = '';
  creditList.innerHTML = '';
  credits.hidden = true;

  musicTypes
    .filter((musicType) => musicType.artists.length > 0)
    .forEach((musicType, index) => {
      const artist = musicType.artists[0];
      const card = document.createElement('article');
      card.className = `genre-card${index === 0 ? ' genre-card-featured' : ''}`;

      const link = document.createElement('a');
      link.className = 'genre-card-link';
      link.href = `/topartists.html?genre=${encodeURIComponent(musicType.name)}`;
      link.setAttribute('aria-label', `Top artists in ${musicType.name}`);

      const imageFrame = document.createElement('span');
      imageFrame.className = 'genre-card-image-frame';

      const imageURL = getArtistImage(artist);
      if (imageURL) {
        const image = document.createElement('img');
        image.className = 'genre-card-image';
        image.src = imageURL;
        image.alt = `${artist.name}, top artist for ${musicType.name}`;
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
      name.className = 'genre-card-name';
      name.textContent = musicType.name;

      link.append(imageFrame, name);
      card.appendChild(link);
      main.appendChild(card);

      if (!getLocalArtistImage(artist.name) && artist.wikipediaImage?.page
        && !creditedArtists.has(artist.name)) {
        creditedArtists.add(artist.name);
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
};

const getArtistImage = (artist) =>
  getLocalArtistImage(artist.name)
  || artist.wikipediaImage?.url
  || ['mega', 'extralarge', 'large']
    .map((size) => artist.image?.find((image) => image.size === size && image['#text']))
    .find(Boolean)?.['#text']
  || artist.image?.find((image) => image['#text'])?.['#text']
  || '';

// Generate safe, consistent section IDs for genre names
const getGenreId = (name) =>
  `genre-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export { createListings, getArtistImage, getGenreId };