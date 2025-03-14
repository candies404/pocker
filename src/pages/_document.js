import {Head, Html, Main, NextScript} from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <meta charSet="utf-8"/>
                <meta name="theme-color" content="#000000"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <body className="antialiased">
            <Main/>
            <NextScript/>
            </body>
        </Html>
    );
}
