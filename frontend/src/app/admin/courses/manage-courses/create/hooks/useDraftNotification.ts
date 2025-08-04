import { useState, useEffect } from 'react';

export const useDraftNotification = () => {
  const [showDraftNotification, setShowDraftNotification] = useState(false);

  useEffect(() => {
    // Check if we have a draft and this is a fresh page load
    const hasDraft = localStorage.getItem('course_creation_draft');
    const hasScreen = localStorage.getItem('course_creation_current_screen');
    
    if (hasDraft && hasScreen) {
      setShowDraftNotification(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowDraftNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissNotification = () => {
    setShowDraftNotification(false);
  };

  return {
    showDraftNotification,
    dismissNotification
  };
};