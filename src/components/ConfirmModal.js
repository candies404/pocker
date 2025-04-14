import React from 'react';
import Modal from '@/components/Modal';

export default function ConfirmModal({
                                         isOpen,
                                         onClose,
                                         onConfirm,
                                         title,
                                         message,
                                         confirmText = "确认",
                                         cancelText = "取消",
                                         confirmButtonClass = "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold py-2 px-4 rounded",
                                         cancelButtonClass = "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 text-gray-700 font-semibold py-2 px-4 rounded",
                                         isLoading = false,
                                         maxWidth = "max-w-md",
                                         maxHeight = "max-h-[80vh]"
                                     }) {
    const handleConfirmClick = (e) => {
        e.stopPropagation();
        onConfirm(e);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} onOverlayClick={onClose} maxWidth={maxWidth}
               maxHeight={maxHeight}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <p className="mt-2 text-gray-700 dark:text-gray-300">{message}</p>
                <div className="mt-4 flex justify-end space-x-2">
                    <button className={cancelButtonClass} onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={confirmButtonClass} onClick={handleConfirmClick}>
                        {isLoading ? '处理中...' : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
} 