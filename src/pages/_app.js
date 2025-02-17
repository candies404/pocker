import "@/styles/globals.css";
import {ThemeProvider} from '@/utils/themeContext';

export default function App({Component, pageProps}) {
    return (
        <ThemeProvider>
            <Component {...pageProps} />
        </ThemeProvider>
    );
}
