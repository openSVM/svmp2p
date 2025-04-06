/**
 * OpenSVM P2P Exchange - Mobile Interactions
 * Additional JavaScript for mobile-specific functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            // Toggle icon between bars and times
            const icon = mobileMenuBtn.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mainNav.classList.contains('active') && 
            !mainNav.contains(event.target) && 
            !mobileMenuBtn.contains(event.target)) {
            mainNav.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Mobile floating action button
    const mobileFab = document.querySelector('.mobile-fab');
    if (mobileFab) {
        mobileFab.addEventListener('click', function() {
            // Show wallet connection modal on FAB click
            const walletModal = document.getElementById('wallet-modal');
            walletModal.classList.add('active');
        });
    }
    
    // Add touch-friendly interactions for dropdowns
    const dropdowns = document.querySelectorAll('.select-wrapper');
    dropdowns.forEach(dropdown => {
        // Add active class to parent when dropdown is open
        const dropdownOptions = dropdown.querySelector('.dropdown-options');
        dropdownOptions.addEventListener('transitionstart', function() {
            if (dropdownOptions.classList.contains('active')) {
                dropdown.classList.add('active-dropdown');
            }
        });
        
        dropdownOptions.addEventListener('transitionend', function() {
            if (!dropdownOptions.classList.contains('active')) {
                dropdown.classList.remove('active-dropdown');
            }
        });
        
        // Close other dropdowns when opening a new one
        const selectedOption = dropdown.querySelector('.selected-option');
        selectedOption.addEventListener('click', function() {
            dropdowns.forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    const otherOptions = otherDropdown.querySelector('.dropdown-options');
                    otherOptions.classList.remove('active');
                    otherDropdown.classList.remove('active-dropdown');
                }
            });
        });
    });
    
    // Improve table scrolling on mobile
    const comparisonTableWrapper = document.querySelector('.comparison-table-wrapper');
    if (comparisonTableWrapper) {
        // Add visual indicator when table is scrollable
        const updateScrollIndicator = function() {
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                if (comparisonTableWrapper.scrollWidth > comparisonTableWrapper.clientWidth) {
                    scrollIndicator.style.display = 'flex';
                    
                    // Update indicator based on scroll position
                    if (comparisonTableWrapper.scrollLeft === 0) {
                        scrollIndicator.classList.add('can-scroll-right');
                        scrollIndicator.classList.remove('can-scroll-left');
                    } else if (comparisonTableWrapper.scrollLeft + comparisonTableWrapper.clientWidth >= comparisonTableWrapper.scrollWidth - 5) {
                        scrollIndicator.classList.add('can-scroll-left');
                        scrollIndicator.classList.remove('can-scroll-right');
                    } else {
                        scrollIndicator.classList.add('can-scroll-left');
                        scrollIndicator.classList.add('can-scroll-right');
                    }
                } else {
                    scrollIndicator.style.display = 'none';
                }
            }
        };
        
        // Initialize and update on resize
        updateScrollIndicator();
        window.addEventListener('resize', updateScrollIndicator);
        
        // Update on scroll
        comparisonTableWrapper.addEventListener('scroll', updateScrollIndicator);
    }
    
    // Add swipe functionality for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Detect swipe on comparison table
    if (comparisonTableWrapper) {
        comparisonTableWrapper.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        comparisonTableWrapper.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            // No need to implement custom swipe as native scrolling works well
            // This is just for potential future enhancements
        }
    }
    
    // Improve mobile form experience
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        // Add active class to parent when input is focused
        input.addEventListener('focus', function() {
            const parent = this.closest('.filter-item');
            if (parent) {
                parent.classList.add('active-input');
            }
        });
        
        input.addEventListener('blur', function() {
            const parent = this.closest('.filter-item');
            if (parent) {
                parent.classList.remove('active-input');
            }
        });
    });
    
    // Sticky header on scroll for mobile
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (window.innerWidth <= 768) {
            if (scrollTop > lastScrollTop && scrollTop > 60) {
                // Scrolling down
                header.classList.add('header-hidden');
            } else {
                // Scrolling up
                header.classList.remove('header-hidden');
            }
        } else {
            header.classList.remove('header-hidden');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Adjust viewport height for mobile browsers
    function setMobileViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setMobileViewportHeight();
    window.addEventListener('resize', setMobileViewportHeight);
    
    // Double tap prevention for mobile
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent double taps
            if (this.getAttribute('data-clicked') === 'true') {
                e.preventDefault();
                return;
            }
            
            this.setAttribute('data-clicked', 'true');
            setTimeout(() => {
                this.removeAttribute('data-clicked');
            }, 300);
        });
    });
    
    // Add active states for better mobile feedback
    document.querySelectorAll('.btn, .selected-option, .wallet-option').forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        ['touchend', 'touchcancel'].forEach(event => {
            element.addEventListener(event, function() {
                this.classList.remove('touch-active');
            });
        });
    });
    
    // Detect mobile device for specific optimizations
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('is-mobile-device');
        
        // Optimize modals for mobile
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('touchmove', function(e) {
                // Allow scrolling inside modal content but not background
                if (!e.target.closest('.modal-body')) {
                    e.preventDefault();
                }
            });
        });
    }
});
