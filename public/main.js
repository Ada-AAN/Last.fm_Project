
import { createNavigation } from './navigation.js';
import { createListings } from './listings.js';

try {
  const response = await fetch('/tags');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  if (!Array.isArray(data.tags?.tag)) {
    console.error('Unexpected response from /tags:', data);
    throw new Error('The server response did not contain a tags list; see the logged response.');
  }

  const tags = data.tags.tag;
  const musicTypes = await Promise.all(
    tags.map(async (tag) => {
      const artistResponse = await fetch(`/artists?tag=${encodeURIComponent(tag.name)}`);
      const artistData = await artistResponse.json();

      if (!artistResponse.ok) {
        throw new Error(`Could not load artists for "${tag.name}": ${artistData.error || artistResponse.status}`);
      }

      if (!Array.isArray(artistData.topartists?.artist)) {
        console.error(`Unexpected artist response for "${tag.name}":`, artistData);
        throw new Error(`The server response did not contain artists for "${tag.name}".`);
      }

      return {
        name: tag.name,
        url: tag.url,
        artists: artistData.topartists.artist
      };
    })
  );

  console.log('Genres with Artists', musicTypes);
  createListings(musicTypes);
  createNavigation(musicTypes);
} catch (error) {
  console.error('Could not fetch Last.fm top tags:', error);
}