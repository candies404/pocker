import React from 'react';
import Modal from '@/components/Modal';

export default function FormModal({
                                      isOpen,
                                      onClose,
                                      title,
                                      children,
                                      maxWidth = "md:w-1/2", // 默认宽度，可以通过props覆盖
                                      isLoading = false
                                  }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onOverlayClick={onClose}
            maxWidth={maxWidth}
        >
            <div className={`bg-white dark:bg-gray-800 rounded-lg ${isLoading ? 'opacity-50' : ''}`}>
                {children}
            </div>
        </Modal>
    );
} 