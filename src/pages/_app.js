import "@/styles/globals.css";
import {ThemeProvider} from '@/utils/themeContext';
import Footer from '@/components/Footer';
import {Analytics} from '@vercel/analytics/react';
import {SpeedInsights} from "@vercel/speed-insights/next";
import Head from 'next/head';
import {APP_CONFIG} from '@/config/version';

export default function App({Component, pageProps}) {
    return (
        <ThemeProvider>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="description" content="让每个人都有自己的 Docker 私服"/>
                <title>{`${APP_CONFIG.name} - Docker 镜像私服`}</title>
            </Head>
            <Component {...pageProps}/>
            <Footer/>
            <Analytics/>
            <SpeedInsights/>
        </ThemeProvider>
    );
}
