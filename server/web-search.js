const TAVILY_URL = 'https://api.tavily.com/search';

export async function webSearch(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY is not configured on the server.');

  const response = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      topic: 'general',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Web search failed (${response.status}): ${data?.detail || data?.message || 'Unknown search provider error'}`);
  }

  return (data.results || []).map((result) => ({
    title: result.title || '',
    url: result.url || '',
    content: result.content || '',
    score: result.score ?? null,
  })).filter((result) => result.url && result.content);
}
