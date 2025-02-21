import "@/styles/globals.css";
import {ThemeProvider} from '@/utils/themeContext';
import Footer from '@/components/Footer';

export default function App({Component, pageProps}) {
    return (
        <ThemeProvider>
            <Component {...pageProps} />
            <Footer/>
        </ThemeProvider>
    );
}
