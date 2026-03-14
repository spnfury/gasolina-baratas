// Gasolina Baratas — Article Page (Localizaciones)
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSlugs, getPostBySlug } from '@/lib/nocodb';
import { notFound } from 'next/navigation';

function markdownToHtml(md: string): string {
    let html = md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/(<li>.*?<\/li>)(\s*<li>)/g, '$1$2');
    html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');
    html = `<p>${html}</p>`;
    html = html
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<p>\s*(<h[1-3]>)/g, '$1')
        .replace(/(<\/h[1-3]>)\s*<\/p>/g, '$1')
        .replace(/<p>\s*(<ul>)/g, '$1')
        .replace(/(<\/ul>)\s*<\/p>/g, '$1');
    return html;
}

export async function generateStaticParams() {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const { slug } = await props.params;
    const post = await getPostBySlug(slug);
    if (!post) return { title: 'Artículo no encontrado' };
    return {
        title: post.Title,
        description: post.Excerpt,
        alternates: { canonical: `https://gasolinasbaratas.es/blog/${post.Slug}` },
        openGraph: {
            title: post.Title, description: post.Excerpt, type: 'article',
            siteName: 'Gasolineras Baratas', locale: 'es_ES',
            publishedTime: post.PublishedAt,
            images: post.CoverImage ? [{ url: post.CoverImage }] : [],
        },
    };
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CATEGORY_EMOJIS: Record<string, string> = { Ciudades: '🏙️', Rutas: '🛣️', Comparativas: '⚖️', Guías: '📍' };

export default async function ArticlePage(props: PageProps) {
    const { slug } = await props.params;
    const post = await getPostBySlug(slug);
    if (!post) notFound();
    const contentHtml = markdownToHtml(post.Content);

    return (
        <div className="rg-landing">
            <nav className="rg-navbar">
                <div className="rg-navbar-inner">
                    <Link href="/" className="rg-nav-logo">📍 <span>Gasolineras</span>Baratas</Link>
                    <div className="rg-nav-links">
                        <Link href="/">Blog</Link>
                        <a href="https://app.radargas.com" className="rg-nav-cta">Mapa Interactivo →</a>
                    </div>
                </div>
            </nav>

            <section className="blog-article-header">
                <div className="rg-container">
                    <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
                        <Link href="/">Inicio</Link>
                        <span className="blog-breadcrumb-sep">/</span>
                        <span>{post.Category}</span>
                    </nav>
                    <div className="blog-article-meta">
                        <span className="blog-card-category">{CATEGORY_EMOJIS[post.Category] || '📰'} {post.Category}</span>
                        <span className="blog-card-date">{formatDate(post.PublishedAt)}</span>
                    </div>
                    <h1 className="blog-article-title">{post.Title}</h1>
                    <p className="blog-article-excerpt">{post.Excerpt}</p>
                </div>
            </section>

            {post.CoverImage && (
                <div className="blog-article-cover"><div className="rg-container"><img src={post.CoverImage} alt={post.Title} /></div></div>
            )}

            <article className="blog-article-content">
                <div className="rg-container">
                    <div className="blog-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                </div>
            </article>

            <section className="blog-cta">
                <div className="rg-container">
                    <h2>Encuentra la gasolinera más barata cerca de ti</h2>
                    <p>Usa el mapa interactivo con más de 12.000 gasolineras de toda España.</p>
                    <div className="rg-hero-buttons">
                        <a href="https://app.radargas.com" className="rg-btn primary">📍 Ver Mapa</a>
                        <Link href="/" className="rg-btn secondary">← Volver al blog</Link>
                    </div>
                </div>
            </section>

            <footer className="rg-footer">
                <div className="rg-footer-inner">
                    <div className="rg-footer-bottom">
                        <span>© {new Date().getFullYear()} Gasolineras Baratas — Datos MITECO</span>
                        <span>Precios orientativos</span>
                    </div>
                </div>
            </footer>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org', '@type': 'NewsArticle',
                        headline: post.Title, description: post.Excerpt,
                        datePublished: post.PublishedAt, image: post.CoverImage || undefined,
                        author: { '@type': 'Organization', name: 'Gasolineras Baratas' },
                        publisher: { '@type': 'Organization', name: 'Gasolineras Baratas' },
                        articleSection: post.Category,
                    }),
                }}
            />
        </div>
    );
}
