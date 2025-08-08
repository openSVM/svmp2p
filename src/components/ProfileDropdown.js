import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Profile dropdown items
  const profileItems = [
    { key: 'profile', label: 'PROFILE', icon: 'P', href: '/profile' },
    { key: 'myoffers', label: 'MY OFFERS', icon: 'M', href: '/myoffers' },
    { key: 'disputes', label: 'DISPUTES', icon: 'D', href: '/disputes' },
    { key: 'rewards', label: 'REWARDS', icon: 'R', href: '/rewards' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  // Check if any profile item is active
  const isAnyProfileItemActive = profileItems.some(item => router.pathname === item.href);

  return (
    <div className="ascii-dropdown-container" ref={dropdownRef}>
      <button
        className={`ascii-nav-tab ascii-dropdown-trigger ${isAnyProfileItemActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        PROFILE ▼
      </button>
      
      {isOpen && (
        <div className="ascii-dropdown-menu">
          {profileItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`ascii-dropdown-item ${router.pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}