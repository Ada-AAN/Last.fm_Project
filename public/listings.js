
import { getLocalArtistImage } from './artist-images.js';

const createListings = (musicTypes) => {
  const main = document.querySelector('main');

  // Clear previous listings if the function runs again
  main.innerHTML = '';

  musicTypes
    .filter((musicType) => musicType.artists.length > 0)
    .forEach((musicType) => {
      const section = document.createElement('section');
      section.classList.add('genre-section');
      section.id = getGenreId(musicType.name);

      musicType.artists.forEach((artist) => {
        const div = document.createElement('div');
        div.classList.add('listing');

        const imageURL = getLocalArtistImage(artist.name)
          || artist.wikipediaImage?.url
          || artist.image?.find((image) => image.size === 'large')?.['#text']
          || '';

        const link = document.createElement('a');
        link.className = 'artist-link';
        link.href = `/artist.html?name=${encodeURIComponent(artist.name)}`;

        const img = document.createElement('img');
        img.className = 'artist-image';
        img.src = imageURL;
        img.alt = `${artist.name} artwork`;
        img.loading = 'lazy';

        // Hide missing artwork rather than displaying a broken image
        img.addEventListener('error', () => {
          img.style.display = 'none';
        });

        const name = document.createElement('span');
        name.textContent = artist.name;

        link.append(img, name);
        div.appendChild(link);
        section.appendChild(div);
      });

      main.appendChild(section);
    });
};

// Generate safe, consistent section IDs for genre names
const getGenreId = (name) =>
  `genre-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export { createListings, getGenreId };