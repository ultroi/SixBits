// In-memory cache keyed by `${limit}_${relaxed}` -> { ts: number, articles: [] }
const cache = new Map();

const ONE_HOUR_MS = 60 * 60 * 1000;

const getEducationNews = async (req, res) => {
  // Safe fetch resolution: use global.fetch if available (Node 18+), else try node-fetch if installed
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try {
      // eslint-disable-next-line global-require
      fetchFn = require('node-fetch');
      // node-fetch v3 exports default; ensure compatibility
      if (fetchFn && fetchFn.default) fetchFn = fetchFn.default;
    } catch (e) {
      console.error('Fetch is not available in this Node environment. Please use Node 18+ or install node-fetch.');
      return res.status(500).json({ error: 'Server missing fetch implementation' });
    }
  }

  try {
    // parse query params
    const relaxed = req && req.query && String(req.query.relaxed) === '1';
    let limit = parseInt((req && req.query && req.query.limit) || '5', 10);
    if (Number.isNaN(limit)) limit = 5;
    // Clamp allowed limits to 1..5
    limit = Math.min(5, Math.max(1, limit));

    const cacheKey = `${limit}_${relaxed ? 1 : 0}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.ts) < ONE_HOUR_MS) {
      // serve from cache
      return res.json((cached.articles || []).slice(0, limit));
    }

    const apiKey = 'cac978cb2236445297f2da4e53b3bf68';

    // Education-related keywords to search for in titles/descriptions
    const eduKeywords = ['education', 'school', 'college', 'university', 'exam', 'syllabus', 'curriculum', 'teacher', 'students', 'student', 'admission', 'admissions', 'scholarship', 'upsc', 'neet', 'jee', 'curricula'];

    // Build title-focused queries (qInTitle helps narrow to headlines)
    const titleQuery = eduKeywords.map(k => k).join(' OR ');

    // First try: prioritize Jammu & Kashmir education headlines
    const region = '"Jammu and Kashmir"';
    const regionQuery = `${region} AND (${titleQuery})`;
    const regionUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(regionQuery)}&apiKey=${apiKey}&sortBy=publishedAt&language=en&pageSize=12`;

    const regionResp = await fetchFn(regionUrl);
    const regionData = await regionResp.json();

    // Prefer trusted education/news domains to reduce noise (substring match)
    const domainWhitelist = [
      'thehindu.com',
      'indianexpress.com',
      'timesofindia.indiatimes.com',
      'hindustantimes.com',
      'edexlive.com',
      'educationtimes',
      'ndtv.com',
      'gov.in',
      'scroll.in',
      'telegraphindia.com',
      'tribuneindia.com'
    ];

    const filterArticles = (articles) => {
      if (!Array.isArray(articles)) return [];
      const loweredKeywords = eduKeywords.map(k => k.toLowerCase());

      const isWhitelisted = (url, sourceName) => {
        if (!url && !sourceName) return false;
        const lowerUrl = (url || '').toLowerCase();
        const lowerSource = (sourceName || '').toLowerCase();
        return domainWhitelist.some(d => lowerUrl.includes(d) || lowerSource.includes(d.replace('.com','')));
      };

      // Strict: require keyword in title
      const byTitle = articles.filter(a => {
        const title = (a.title || '').toLowerCase();
        if (!title) return false;
        return loweredKeywords.some(k => new RegExp('\\b' + k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i').test(title));
      });

      // Prefer whitelisted among title matches
      const whitelisted = byTitle.filter(a => isWhitelisted(a.url, (a.source && a.source.name) || ''));
      if (whitelisted.length > 0) return whitelisted;
      if (byTitle.length > 0) return byTitle;

      // Less strict: check title/description/content
      const byAnywhere = articles.filter(a => {
        const title = (a.title || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const content = (a.content || '').toLowerCase();
        return loweredKeywords.some(k => title.includes(k) || desc.includes(k) || content.includes(k));
      });

      const whitelistedAnywhere = byAnywhere.filter(a => isWhitelisted(a.url, (a.source && a.source.name) || ''));
      if (whitelistedAnywhere.length > 0) return whitelistedAnywhere;

      return byAnywhere;
    };

    let finalArticles = [];

    if (regionData && regionData.status === 'ok') {
      const regionMatches = filterArticles(regionData.articles || []);
      if (regionMatches.length > 0) finalArticles = regionMatches;
    }

    if (finalArticles.length === 0) {
      // Second try: headlines with education keywords in title (broader)
      const titleOnlyUrl = `https://newsapi.org/v2/everything?qInTitle=${encodeURIComponent(titleQuery)}&apiKey=${apiKey}&sortBy=publishedAt&language=en&pageSize=12`;
      const titleResp = await fetchFn(titleOnlyUrl);
      const titleData = await titleResp.json();

      if (titleData && titleData.status === 'ok') {
        const titleMatches = filterArticles(titleData.articles || []);
        if (titleMatches.length > 0) finalArticles = titleMatches;
      }
    }

    if (finalArticles.length === 0) {
      // Final fallback: general education query (less strict)
      const fallbackQuery = 'education';
      const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(fallbackQuery)}&apiKey=${apiKey}&sortBy=publishedAt&language=en&pageSize=12`;
      const fallbackResp = await fetchFn(fallbackUrl);
      const fallbackData = await fallbackResp.json();

      if (fallbackData && fallbackData.status === 'ok') {
        const fallbackMatches = filterArticles(fallbackData.articles || []);
        if (fallbackMatches.length > 0) finalArticles = fallbackMatches;

        if (finalArticles.length === 0) {
          if (!relaxed) {
            // Cache empty result too so we don't hammer the API
            cache.set(cacheKey, { ts: now, articles: [] });
            return res.json([]);
          }
          // relaxed: keep raw fallback articles
          finalArticles = fallbackData.articles || [];
        }
      }
    }

    // Ensure array and limit
    finalArticles = (finalArticles || []).slice(0, Math.max(1, limit));

    // Store in cache
    cache.set(cacheKey, { ts: now, articles: finalArticles });

    return res.json(finalArticles);
  } catch (error) {
    console.error('Error fetching education news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEducationNews,
};