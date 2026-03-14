// Gasolina Baratas — Blog Listing (Localizaciones)
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/nocodb';

export const metadata: Metadata = {
    title: 'Gasolineras Baratas — Dónde Repostar Barato en España',
    description:
        'Encuentra las gasolineras más baratas cerca de ti. Guías actualizadas por ciudad, provincia y autopista.',
    alternates: { canonical: 'https://gasolinasbaratas.es' },
    openGraph: {
        title: 'Gasolineras Baratas — Dónde Repostar Barato',
        description: 'Encuentra las gasolineras más baratas en España por ciudad y ruta.',
        type: 'website',
        siteName: 'Gasolineras Baratas',
        locale: 'es_ES',
    },
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CATEGORY_EMOJIS: Record<string, string> = {
    Ciudades: '🏙️',
    Rutas: '🛣️',
    Comparativas: '⚖️',
    Guías: '📍',
};

export default async function BlogPage() {
    const posts = await getAllPosts();

    return (
        <div className="rg-landing">
            <nav className="rg-navbar">
                <div className="rg-navbar-inner">
                    <Link href="/" className="rg-nav-logo">
                        📍 <span>Gasolineras</span>Baratas
                    </Link>
                    <div className="rg-nav-links">
                        <Link href="/">Inicio</Link>
                        <a href="https://app.radargas.com" className="rg-nav-cta">
                            Mapa Interactivo →
                        </a>
                    </div>
                </div>
            </nav>

            <section className="blog-hero">
                <div className="rg-container">
                    <div className="rg-hero-badge">
                        <span className="dot" />
                        Guías actualizadas
                    </div>
                    <h1>
                        <span className="green">Gasolineras</span> Baratas
                    </h1>
                    <p className="blog-hero-sub">
                        Guías por ciudad, provincia y autopista para encontrar
                        las gasolineras más baratas de España.
                    </p>
                </div>
            </section>

            <section className="blog-grid-section">
                <div className="rg-container">
                    {posts.length === 0 ? (
                        <div className="blog-empty">
                            <p>No hay artículos publicados todavía. ¡Vuelve pronto!</p>
                        </div>
                    ) : (
                        <div className="blog-grid">
                            {posts.map((post) => (
                                <Link key={post.Slug} href={`/blog/${post.Slug}`} className="blog-card">
                                    {post.CoverImage && (
                                        <div className="blog-card-img">
                                            <img src={post.CoverImage} alt={post.Title} loading="lazy" />
                                        </div>
                                    )}
                                    <div className="blog-card-body">
                                        <div className="blog-card-meta">
                                            <span className="blog-card-category">
                                                {CATEGORY_EMOJIS[post.Category] || '📰'} {post.Category}
                                            </span>
                                            <span className="blog-card-date">{formatDate(post.PublishedAt)}</span>
                                        </div>
                                        <h2 className="blog-card-title">{post.Title}</h2>
                                        <p className="blog-card-excerpt">{post.Excerpt}</p>
                                        <span className="blog-card-link">Leer más →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="blog-cta">
                <div className="rg-container">
                    <h2>Encuentra la gasolinera más barata cerca de ti</h2>
                    <p>Usa el mapa interactivo de RadarGas para ver todas las estaciones a tu alrededor.</p>
                    <a href="https://app.radargas.com" className="rg-btn primary">📍 Ver Mapa Interactivo</a>
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
                        '@context': 'https://schema.org',
                        '@type': 'Blog',
                        name: 'Gasolineras Baratas',
                        description: 'Guías para encontrar las gasolineras más baratas de España.',
                        publisher: { '@type': 'Organization', name: 'Gasolineras Baratas' },
                        blogPost: posts.map((p) => ({
                            '@type': 'BlogPosting',
                            headline: p.Title,
                            url: `/blog/${p.Slug}`,
                            datePublished: p.PublishedAt,
                            description: p.Excerpt,
                        })),
                    }),
                }}
            />
        </div>
    );
}
