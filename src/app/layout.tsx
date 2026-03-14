import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: {
        template: '%s | Gasolineras Baratas España',
        default: 'Gasolineras Baratas — Dónde Repostar Barato en España',
    },
    description:
        'Encuentra las gasolineras más baratas cerca de ti. Guías por ciudad, provincia y autopista para repostar al mejor precio en España.',
    keywords: [
        'gasolineras baratas',
        'gasolinera barata cerca',
        'donde repostar barato',
        'gasolinera más barata madrid',
        'gasolineras baratas españa',
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
