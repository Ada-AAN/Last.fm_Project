import { getGenreId } from './listings.js';
import { getLocalArtistImage } from './artist-images.js';

const createNavigation = (genreTypes) => {
  const nav = document.querySelector('nav');
  const credits = document.querySelector('#image-credits');
  const creditList = credits.querySelector('ul');
  nav.innerHTML = '';
  creditList.innerHTML = '';
  credits.hidden = true;

  genreTypes
    .filter((genreType) => genreType.artists.length > 0)
    .forEach((genreType, index) => {
      const item = document.createElement('div');
      item.className = 'nav-item';

      const button = document.createElement('button');
      const artist = genreType.artists[0];
      const images = artist.image ?? [];
      const imageURL = getLocalArtistImage(artist.name)
        || artist.wikipediaImage?.url
        || ['mega', 'extralarge', 'large']
          .map((size) => images.find((image) => image.size === size && image['#text']))
          .find(Boolean)?.['#text']
        || images.find((image) => image['#text'])?.['#text'];

      if (imageURL) {
        const img = document.createElement('img');
        img.src = imageURL;
        img.alt = `${artist.name} image`;
        img.className = 'nav-image';
        img.addEventListener('error', () => {
          img.style.display = 'none';
        });
        button.appendChild(img);
      }

      const label = document.createElement('span');
      label.textContent = genreType.name;
      button.appendChild(label);

      button.addEventListener('click', () => {
        document.querySelectorAll('main section')
          .forEach((section) => section.classList.remove('active'));
        document.getElementById(getGenreId(genreType.name))?.classList.add('active');
      });

      item.prepend(button);
      nav.appendChild(item);

      for (const creditedArtist of genreType.artists) {
        if (getLocalArtistImage(creditedArtist.name) || !creditedArtist.wikipediaImage?.page) {
          continue;
        }

        const credit = document.createElement('li');
        const artistName = document.createElement('span');
        artistName.textContent = `${creditedArtist.name}: `;

        const source = document.createElement('a');
        source.href = creditedArtist.wikipediaImage.page;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.textContent = 'Wikipedia';

        credit.append(artistName, source);
        creditList.appendChild(credit);
        credits.hidden = false;
      }

      if (index === 0) {
        button.click();
      }
    });
};

export { createNavigation };
