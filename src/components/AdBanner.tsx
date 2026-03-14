'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
    style?: React.CSSProperties;
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

/**
 * Google AdSense ad banner component.
 * Place this between sections for in-content ads.
 */
export default function AdBanner({ slot, format = 'auto', style }: AdBannerProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const pushed = useRef(false);

    useEffect(() => {
        if (pushed.current) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch (e) {
            // AdSense not loaded or ad blocker
        }
    }, []);

    return (
        <div
            ref={adRef}
            className="ad-container"
            style={{
                textAlign: 'center',
                margin: '32px 0',
                minHeight: 90,
                overflow: 'hidden',
                ...style,
            }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXX"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
}
