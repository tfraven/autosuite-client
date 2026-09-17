import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  itemName = 'this item',
  targetValue = '',
  promptLabel = 'Type to confirm deletion:'
}) {
  const { t, isRomanUrdu } = useLanguage();
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUserInput('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMatch = userInput.trim() === String(targetValue).trim();

  const handleConfirm = async () => {
    if (!isMatch || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container danger-modal glass-panel slide-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header danger-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge icon-badge-rose">
              <ShieldAlert size={22} className="text-rose" />
            </div>
            <div>
              <h3>{title}</h3>
              <span className="text-muted text-xs">
                {isRomanUrdu ? 'Soft delete aur hisaab ki hifazat' : 'Soft deletion & audit security'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="danger-alert-box">
            <AlertTriangle size={18} className="text-rose shrink-0" />
            <div>
              <p className="danger-alert-title">
                {t('delete_warning_title')}
              </p>
              <p className="danger-alert-text">
                {t('delete_warning_desc')}
              </p>
            </div>
          </div>

          <div className="required-target-box mt-3">
            <span className="text-xs text-muted">{promptLabel}</span>
            <div className="target-string-chip font-mono select-all">
              {targetValue}
            </div>
          </div>

          <div className="form-field mt-3">
            <input
              type="text"
              className="form-input font-mono delete-confirm-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Type "${targetValue}"`}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            {t('btn_cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={!isMatch || isSubmitting}
            onClick={handleConfirm}
          >
            <Trash2 size={16} />
            {isSubmitting
              ? (isRomanUrdu ? 'Hazaf ho raha hai…' : 'Deleting…')
              : (isRomanUrdu ? 'Delete Karein' : `Delete ${itemName}`)}
          </button>
        </div>
      </div>
    </div>
  );
}
