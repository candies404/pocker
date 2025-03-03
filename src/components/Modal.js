import React, {useEffect} from 'react';
import ReactDOM from 'react-dom';

// 用于追踪打开的模态框数量
let openModalsCount = 0;

const Modal = ({isOpen, onClose, title, onOverlayClick, maxWidth = "md:w-1/2", children}) => {
    useEffect(() => {
        if (isOpen) {
            // 第一个模态框打开时禁用滚动
            if (openModalsCount === 0) {
                document.body.style.overflow = 'hidden';
            }
            openModalsCount++;
        }

        return () => {
            if (isOpen) {
                openModalsCount--;
                // 最后一个模态框关闭时恢复滚动
                if (openModalsCount === 0) {
                    document.body.style.overflow = 'unset';
                }
            }
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