// RadarGas Blog — NocoDB Client
// Fetches blog posts from NocoDB (headless CMS)

const API_URL = process.env.NOCODB_API_URL || '';
const API_TOKEN = process.env.NOCODB_API_TOKEN || '';
const TABLE_ID = process.env.NOCODB_BLOG_TABLE_ID || '';

export interface BlogPost {
    Id: number;
    Title: string;
    Slug: string;
    Excerpt: string;
    Content: string;
    CoverImage: string;
    Category: string;
    Published: boolean;
    PublishedAt: string;
}

async function nocoFetch(endpoint: string, options?: RequestInit) {
    if (!API_URL || !API_TOKEN || !TABLE_ID) {
        console.warn('[NocoDB] Missing env vars — returning empty data');
        return { list: [] };
    }
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    if (!res.ok) {
        console.error(`NocoDB API error: ${res.status} ${res.statusText}`);
        return { list: [] };
    }
    return res.json();
}

/**
 * Get all published blog posts, ordered by PublishedAt descending.
 */
export async function getAllPosts(): Promise<BlogPost[]> {
    const data = await nocoFetch(
        `/api/v1/db/data/noco/p8wh8nhbbaikuv8/${TABLE_ID}?where=(Published,eq,true)&sort=-PublishedAt&limit=100`,
        { next: { revalidate: 3600 } } as RequestInit
    );
    return (data.list || []) as BlogPost[];
}

/**
 * Get a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const data = await nocoFetch(
        `/api/v1/db/data/noco/p8wh8nhbbaikuv8/${TABLE_ID}?where=(Slug,eq,${encodeURIComponent(slug)})&limit=1`,
        { next: { revalidate: 3600 } } as RequestInit
    );
    const list = data.list || [];
    return list.length > 0 ? (list[0] as BlogPost) : null;
}

/**
 * Get all slugs for static generation.
 */
export async function getAllSlugs(): Promise<string[]> {
    const data = await nocoFetch(
        `/api/v1/db/data/noco/p8wh8nhbbaikuv8/${TABLE_ID}?where=(Published,eq,true)&fields=Slug&limit=500`,
        { next: { revalidate: 3600 } } as RequestInit
    );
    return (data.list || []).map((row: { Slug: string }) => row.Slug);
}
