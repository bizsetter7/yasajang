'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthModal from './AuthModal';

export default function AuthModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('auth') === 'login') {
      const timer = setTimeout(() => setIsOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);
    // URL에서 ?auth=login 제거
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    router.replace(url.pathname + (url.search || ''));
  };

  return <AuthModal isOpen={isOpen} onClose={handleClose} />;
}
