import "@/styles/globals.css";
import {ThemeProvider} from '@/utils/themeContext';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';

export default function App({Component, pageProps}) {
    return (
        <ThemeProvider>
            <Component {...pageProps} />
            <Footer/>
            <Analytics />
        </ThemeProvider>
    );
}
