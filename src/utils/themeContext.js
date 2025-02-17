import {createContext, useContext, useEffect, useState} from 'react';

const ThemeContext = createContext({
    isDark: false,
    toggleTheme: () => {
    },
});

export function ThemeProvider({children}) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // 从 localStorage 读取主题设置
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
    }, []);

    useEffect(() => {
        // 根据 isDark 状态更新 document.documentElement
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    return (
        <ThemeContext.Provider value={{isDark, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
} 