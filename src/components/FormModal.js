import {useEffect, useRef} from 'react';

export default function FormModal({
                                      isOpen,
                                      onClose,
                                      title,
                                      children,
                                      isLoading = false,
                                      maxWidth = 'max-w-md'
                                  }) {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (isOpen) {
                const scrollY = document.body.style.top;
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 overflow-y-auto">
            <div ref={modalRef} className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full ${maxWidth} m-4`}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>
                {children}
            </div>
        </div>
    );
} 