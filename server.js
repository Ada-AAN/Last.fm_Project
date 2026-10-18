// Import libraries
import express from 'express';

const app = express();

app.get('/', (req, res) => { res.redirect('/start.html') })

// Serve static files from /public folder
app.use(express.static('public'));

app.get('/tags', async (req, res) => {
    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'chart.gettoptags');
    url.searchParams.set('api_key', process.env.LASTFM_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '17');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`Last.fm returned HTTP ${response.status}.`);
            return res.status(502).json({ error: `Last.fm returned HTTP ${response.status}.` });
        }

        if (data.error) {
            console.error(`Last.fm API error ${data.error}: ${data.message}`);
            return res.status(502).json({ error: data.message, code: data.error });
        }

        return res.json(data);
    } catch (error) {
        console.error('Could not retrieve Last.fm top tags:', error);
        return res.status(502).json({ error: 'Could not retrieve data from Last.fm.' });
    }
});


app.get('/albums', async (req, res) => {
    const artist = req.query.artist;
    if (typeof artist !== 'string' || !artist.trim()) {
        return res.status(400).json({ error: 'An artist query parameter is required.' });
    }

    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'artist.gettopalbums');
    url.searchParams.set('artist', artist);
    url.searchParams.set('api_key', process.env.LASTFM_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '4');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`Last.fm returned HTTP ${response.status} for albums by "${artist}".`);
            return res.status(502).json({ error: `Last.fm returned HTTP ${response.status}.` });
        }

        if (data.error) {
            console.error(`Last.fm API error ${data.error} for albums by "${artist}": ${data.message}`);
            return res.status(502).json({ error: data.message, code: data.error });
        }

        return res.json(data);
    } catch (error) {
        console.error(`Could not retrieve Last.fm top albums for "${artist}":`, error);
        return res.status(502).json({ error: 'Could not retrieve data from Last.fm.' });
    }
});

app.get('/albuminfo', async (req, res) => {
    const { artist, album } = req.query;
    if (typeof artist !== 'string' || !artist.trim()
        || typeof album !== 'string' || !album.trim()) {
        return res.status(400).json({ error: 'Artist and album query parameters are required.' });
    }

    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'album.getinfo');
    url.searchParams.set('artist', artist);
    url.searchParams.set('album', album);
    url.searchParams.set('api_key', process.env.LASTFM_KEY);
    url.searchParams.set('format', 'json');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`Last.fm returned HTTP ${response.status} for "${album}" by "${artist}".`);
            return res.status(502).json({ error: `Last.fm returned HTTP ${response.status}.` });
        }

        if (data.error) {
            console.error(`Last.fm API error ${data.error} for "${album}" by "${artist}": ${data.message}`);
            return res.status(502).json({ error: data.message, code: data.error });
        }

        return res.json(data);
    } catch (error) {
        console.error(`Could not retrieve "${album}" by "${artist}" from Last.fm:`, error);
        return res.status(502).json({ error: 'Could not retrieve album data from Last.fm.' });
    }
});

app.get('/artistinfo', async (req, res) => {
    const artist = req.query.artist;
    if (typeof artist !== 'string' || !artist.trim()) {
        return res.status(400).json({ error: 'An artist query parameter is required.' });
    }

    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'artist.getinfo');
    url.searchParams.set('artist', artist);
    url.searchParams.set('api_key', process.env.LASTFM_KEY);
    url.searchParams.set('format', 'json');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`Last.fm returned HTTP ${response.status} for artist "${artist}".`);
            return res.status(502).json({ error: `Last.fm returned HTTP ${response.status}.` });
        }

        if (data.error) {
            console.error(`Last.fm API error ${data.error} for artist "${artist}": ${data.message}`);
            return res.status(502).json({ error: data.message, code: data.error });
        }

        return res.json(data);
    } catch (error) {
        console.error(`Could not retrieve Last.fm info for artist "${artist}":`, error);
        return res.status(502).json({ error: 'Could not retrieve data from Last.fm.' });
    }
});

app.get('/artists', async (req, res) => {
    const tag = req.query.tag;
    if (typeof tag !== 'string' || !tag.trim()) {
        return res.status(400).json({ error: 'A tag query parameter is required.' });
    }

    const limitParam = req.query.limit;
    const artistLimit = limitParam === undefined
        ? 5
        : typeof limitParam === 'string' ? Number(limitParam) : Number.NaN;
    if (!Number.isInteger(artistLimit) || artistLimit < 1 || artistLimit > 12) {
        return res.status(400).json({ error: 'The artist limit must be an integer from 1 to 12.' });
    }

    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    try {
        const topArtistsUrl = new URL('https://ws.audioscrobbler.com/2.0/');
        topArtistsUrl.searchParams.set('method', 'tag.gettopartists');
        topArtistsUrl.searchParams.set('tag', tag);
        topArtistsUrl.searchParams.set('api_key', process.env.LASTFM_KEY);
        topArtistsUrl.searchParams.set('format', 'json');
        topArtistsUrl.searchParams.set('limit', String(artistLimit));

        const topArtistsResponse = await fetch(topArtistsUrl);
        const topArtistsData = await topArtistsResponse.json();

        if (!topArtistsResponse.ok || topArtistsData.error) {
            const message = topArtistsData.message || `Last.fm returned HTTP ${topArtistsResponse.status}.`;
            console.error(`Last.fm top-artists request failed for tag "${tag}": ${message}`);
            return res.status(502).json({ error: message, code: topArtistsData.error });
        }

        const artistsByName = new Map();
        for (const artist of topArtistsData.topartists?.artist ?? []) {
            const name = artist.name.trim().toLowerCase().replace(/\s+/g, ' ');
            const current = artistsByName.get(name);
            const listeners = Number(artist.listeners) || 0;
            const currentListeners = current ? Number(current.listeners) || 0 : -1;
            const playcount = Number(artist.playcount) || 0;
            const currentPlaycount = current ? Number(current.playcount) || 0 : -1;

            if (!current
                || listeners > currentListeners
                || (listeners === currentListeners && playcount > currentPlaycount)) {
                artistsByName.set(name, artist);
            }
        }

        const artists = [...artistsByName.values()];
        if (topArtistsData.topartists) {
            topArtistsData.topartists.artist = artists;
        }

        return res.json(topArtistsData);
    } catch (error) {
        console.error(`Could not retrieve top artists for tag "${tag}":`, error);
        return res.status(502).json({ error: 'Could not retrieve artist data from Last.fm.' });
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Express is live at http://localhost:${port}`);
});