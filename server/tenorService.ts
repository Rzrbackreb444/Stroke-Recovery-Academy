/**
 * Tenor GIF Service
 * Free GIF search and integration for social content
 */

const TENOR_API_ENDPOINT = "https://tenor.googleapis.com/v2";

export interface TenorGif {
  id: string;
  title: string;
  previewUrl: string;
  gifUrl: string;
  mp4Url?: string;
  width: number;
  height: number;
}

export interface TenorSearchResult {
  gifs: TenorGif[];
  next: string;
}

export async function searchGifs(
  query: string,
  options: {
    limit?: number;
    next?: string;
    contentFilter?: 'off' | 'low' | 'medium' | 'high';
  } = {}
): Promise<{ success: boolean; result?: TenorSearchResult; error?: string }> {
  try {
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) {
      throw new Error("TENOR_API_KEY not set");
    }

    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      limit: String(options.limit || 20),
      contentfilter: options.contentFilter || 'medium',
      media_filter: 'gif,tinygif,mp4'
    });

    if (options.next) {
      params.append('pos', options.next);
    }

    const response = await fetch(`${TENOR_API_ENDPOINT}/search?${params}`);

    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }

    const data = await response.json() as {
      results: Array<{
        id: string;
        title: string;
        media_formats: {
          gif?: { url: string; dims: number[] };
          tinygif?: { url: string; dims: number[] };
          mp4?: { url: string };
        };
      }>;
      next: string;
    };

    const gifs: TenorGif[] = data.results.map(r => ({
      id: r.id,
      title: r.title || 'GIF',
      previewUrl: r.media_formats.tinygif?.url || r.media_formats.gif?.url || '',
      gifUrl: r.media_formats.gif?.url || '',
      mp4Url: r.media_formats.mp4?.url,
      width: r.media_formats.gif?.dims?.[0] || 200,
      height: r.media_formats.gif?.dims?.[1] || 200
    }));

    return {
      success: true,
      result: { gifs, next: data.next }
    };
  } catch (error) {
    console.error('Tenor search error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getTrendingGifs(
  options: { limit?: number; next?: string } = {}
): Promise<{ success: boolean; result?: TenorSearchResult; error?: string }> {
  try {
    const apiKey = process.env.TENOR_API_KEY;
    if (!apiKey) {
      throw new Error("TENOR_API_KEY not set");
    }

    const params = new URLSearchParams({
      key: apiKey,
      limit: String(options.limit || 20),
      contentfilter: 'medium',
      media_filter: 'gif,tinygif,mp4'
    });

    if (options.next) {
      params.append('pos', options.next);
    }

    const response = await fetch(`${TENOR_API_ENDPOINT}/featured?${params}`);

    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }

    const data = await response.json() as {
      results: Array<{
        id: string;
        title: string;
        media_formats: {
          gif?: { url: string; dims: number[] };
          tinygif?: { url: string; dims: number[] };
          mp4?: { url: string };
        };
      }>;
      next: string;
    };

    const gifs: TenorGif[] = data.results.map(r => ({
      id: r.id,
      title: r.title || 'GIF',
      previewUrl: r.media_formats.tinygif?.url || r.media_formats.gif?.url || '',
      gifUrl: r.media_formats.gif?.url || '',
      mp4Url: r.media_formats.mp4?.url,
      width: r.media_formats.gif?.dims?.[0] || 200,
      height: r.media_formats.gif?.dims?.[1] || 200
    }));

    return {
      success: true,
      result: { gifs, next: data.next }
    };
  } catch (error) {
    console.error('Tenor trending error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
