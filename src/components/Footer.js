export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-4 mt-0">
            <div className="container mx-auto text-center">
                <p className="text-sm">版本: 0.1.0</p>
                <p className="text-sm">作者: scoful</p>
                <p className="text-sm">
                    博客: <a href="https://github.com/scoful" target="_blank" rel="noopener noreferrer"
                             className="underline text-blue-400 hover:text-blue-300">https://github.com/scoful</a>
                </p>
                <p className="text-sm italic">Slogan: Make Docker Great Again</p>
            </div>
        </footer>
    );
} 