import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';

const Modal = ({isOpen, onClose, title, onOverlayClick, maxWidth = "md:w-1/2", children}) => {
    useEffect(() => {
        if (isOpen) {
            // 禁用背景滚动
            document.body.style.overflow = 'hidden';
        } else {
            // 恢复背景滚动
            document.body.style.overflow = 'unset';
        }

        // 清理函数，确保在组件卸载时恢复滚动
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        e.stopPropagation();
        if (onOverlayClick) {
            onOverlayClick(e);
        }
        onClose();
    };

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80"
            onClick={handleOverlayClick}>
            <div
                className={`relative bg-white rounded-lg p-6 dark:bg-gray-800 overflow-hidden max-h-[80vh] w-full ${maxWidth}`}
                onClick={(e) => e.stopPropagation()}>
                {title && <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xl"
                >
                    ×
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal; 