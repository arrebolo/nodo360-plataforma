/**
 * ============================================================================
 * NODO360 COMMUNITY WIDGET - MAIN JAVASCRIPT
 * Version: 1.0
 * Description: Scroll animations, smooth scrolling, and interactivity
 * ============================================================================
 */

(function() {
    'use strict';

    /**
     * ========================================================================
     * SMOOTH SCROLL
     * ========================================================================
     */
    function initSmoothScroll() {
        // Select all anchor links with hash
        const links = document.querySelectorAll('a[href^="#"]');

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');

                // Ignore empty anchors or just "#"
                if (!href || href === '#') {
                    e.preventDefault();
                    return;
                }

                const target = document.querySelector(href);

                if (target) {
                    e.preventDefault();

                    // Smooth scroll to target
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without jumping
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }

                    // Focus target for accessibility
                    target.focus();
                }
            });
        });
    }

    /**
     * ========================================================================
     * SCROLL ANIMATIONS (Intersection Observer)
     * ========================================================================
     */
    function initScrollAnimations() {
        // Check if Intersection Observer is supported
        if (!('IntersectionObserver' in window)) {
            // Fallback: show all elements immediately
            document.querySelectorAll('.fade-in').forEach(el => {
                el.classList.add('visible');
            });
            return;
        }

        // Intersection Observer options
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport
            threshold: 0.1 // 10% of element must be visible
        };

        // Callback function for observer
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add visible class to trigger animation
                    entry.target.classList.add('visible');

                    // Optional: unobserve after animation (performance optimization)
                    observer.unobserve(entry.target);
                }
            });
        };

        // Create observer instance
        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe all elements with fade-in class
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * ========================================================================
     * BUTTON CLICK TRACKING (Optional Analytics)
     * ========================================================================
     */
    function initButtonTracking() {
        // Track CTA button clicks
        document.querySelectorAll('.btn, .quick-access-btn').forEach(button => {
            button.addEventListener('click', function() {
                const buttonText = this.textContent.trim();
                const buttonHref = this.getAttribute('href');

                // Log to console (replace with actual analytics in production)
                console.log('Button clicked:', {
                    text: buttonText,
                    href: buttonHref,
                    timestamp: new Date().toISOString()
                });

                // Example: Google Analytics event tracking
                // if (window.gtag) {
                //     gtag('event', 'click', {
                //         'event_category': 'CTA',
                //         'event_label': buttonText,
                //         'value': buttonHref
                //     });
                // }

                // Example: Facebook Pixel event tracking
                // if (window.fbq) {
                //     fbq('track', 'Lead', {
                //         content_name: buttonText
                //     });
                // }
            });
        });
    }

    /**
     * ========================================================================
     * EXTERNAL LINK HANDLER
     * ========================================================================
     */
    function initExternalLinks() {
        // Add rel attributes to external links for security
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            const currentRel = link.getAttribute('rel') || '';

            if (!currentRel.includes('noopener')) {
                link.setAttribute('rel', currentRel + ' noopener');
            }

            if (!currentRel.includes('noreferrer')) {
                link.setAttribute('rel', link.getAttribute('rel') + ' noreferrer');
            }
        });
    }

    /**
     * ========================================================================
     * ACCESSIBILITY ENHANCEMENTS
     * ========================================================================
     */
    function initAccessibility() {
        // Add keyboard navigation for cards
        document.querySelectorAll('.feature-card, .access-card').forEach(card => {
            // Make cards focusable
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }

            // Add ARIA labels if missing
            const title = card.querySelector('.feature-title, .access-title');
            if (title && !card.hasAttribute('aria-label')) {
                card.setAttribute('aria-label', title.textContent.trim());
            }
        });

        // Improve button accessibility
        document.querySelectorAll('.btn').forEach(button => {
            // Ensure buttons have appropriate ARIA attributes
            if (!button.hasAttribute('aria-label') && !button.textContent.trim()) {
                console.warn('Button without aria-label or text content:', button);
            }
        });

        // Add focus-visible support for browsers that don't support it
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('user-is-tabbing');
        });
    }

    /**
     * ========================================================================
     * PERFORMANCE MONITORING (Optional)
     * ========================================================================
     */
    function logPerformance() {
        if (!window.performance) return;

        window.addEventListener('load', function() {
            // Get performance metrics
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const connectTime = perfData.responseEnd - perfData.requestStart;
            const renderTime = perfData.domComplete - perfData.domLoading;

            console.log('Performance Metrics:', {
                pageLoadTime: pageLoadTime + 'ms',
                connectTime: connectTime + 'ms',
                renderTime: renderTime + 'ms'
            });

            // Send to analytics if needed
            // if (window.gtag) {
            //     gtag('event', 'timing_complete', {
            //         'name': 'load',
            //         'value': pageLoadTime,
            //         'event_category': 'Performance'
            //     });
            // }
        });
    }

    /**
     * ========================================================================
     * TOAST NOTIFICATIONS (Optional Feature)
     * ========================================================================
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Add toast styles (inline for demo, should be in CSS)
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '16px 24px',
            backgroundColor: type === 'success' ? '#10b981' :
                           type === 'error' ? '#ef4444' :
                           '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 300ms ease-out'
        });

        // Append to body
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';

            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    // Expose showToast globally for use in other scripts
    window.showToast = showToast;

    /**
     * ========================================================================
     * LAZY LOADING IMAGES (Optional Enhancement)
     * ========================================================================
     */
    function initLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading is supported
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        } else {
            // Fallback to Intersection Observer
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * ========================================================================
     * INITIALIZATION
     * ========================================================================
     */
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialize all features
        initSmoothScroll();
        initScrollAnimations();
        initButtonTracking();
        initExternalLinks();
        initAccessibility();
        initLazyLoading();

        // Log performance metrics (optional)
        if (window.location.search.includes('debug=true')) {
            logPerformance();
        }

        console.log('Nodo360 Community Widget initialized successfully');
    }

    // Start initialization
    init();

})();

/**
 * ============================================================================
 * UTILITY FUNCTIONS (Exposed globally if needed)
 * ============================================================================
 */

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function}
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Throttle function for scroll/resize events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Expose utilities globally
window.Nodo360Utils = {
    debounce,
    throttle
};
