// Import libraries
import express from 'express';

const app = express();

// Serve static files from /public folder
app.use(express.static('public'));

app.get('/', (req, res) => { res.redirect('/index.html') })

app.get('/tags', async (req, res) => {
    if (!process.env.LASTFM_KEY) {
        console.error('LASTFM_KEY is not configured.');
        return res.status(500).json({ error: 'Last.fm API key is not configured on the server.' });
    }

    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'chart.gettoptags');
    url.searchParams.set('api_key', process.env.LASTFM_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '15');

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
        topArtistsUrl.searchParams.set('limit', '5');

        const topArtistsResponse = await fetch(topArtistsUrl);
        const topArtistsData = await topArtistsResponse.json();

        if (!topArtistsResponse.ok || topArtistsData.error) {
            const message = topArtistsData.message || `Last.fm returned HTTP ${topArtistsResponse.status}.`;
            console.error(`Last.fm top-artists request failed for tag "${tag}": ${message}`);
            return res.status(502).json({ error: message, code: topArtistsData.error });
        }

        const artists = topArtistsData.topartists?.artist ?? [];
        for (const artist of artists) {
            artist.wikipediaImage = null;

            try {
                const wikipediaUrl = new URL(
                    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist.name)}`
                );
                const wikipediaResponse = await fetch(wikipediaUrl);

                if (wikipediaResponse.status === 404) {
                    continue;
                }

                if (!wikipediaResponse.ok) {
                    throw new Error(`Wikipedia returned HTTP ${wikipediaResponse.status}.`);
                }

                const wikipediaData = await wikipediaResponse.json();

                if (wikipediaData.thumbnail?.source) {
                    artist.wikipediaImage = {
                        url: wikipediaData.thumbnail.source,
                        page: wikipediaData.content_urls?.desktop?.page
                    };
                }
            } catch (error) {
                console.error(`Could not retrieve Wikipedia image for artist "${artist.name}":`, error);
            }
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