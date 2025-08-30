/**
 * Table of Contents - Scroll highlighting and smooth scrolling
 */
(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const tocContainer = document.querySelector('.table-of-contents');
        const hasToC = document.querySelector('.container.has-toc');
        
        // Add class to container when TOC is empty
        if (tocContainer && hasToC) {
            if (tocContainer.innerHTML.trim() === '' || tocContainer.children.length === 0) {
                hasToC.classList.add('toc-empty');
            }
        }
        
        if (!tocContainer) return;

        const tocLinks = tocContainer.querySelectorAll('.toc-link');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        if (tocLinks.length === 0 || headings.length === 0) return;

        // Create a map of heading IDs to their elements
        const headingMap = new Map();
        headings.forEach(heading => {
            if (heading.id) {
                headingMap.set(heading.id, heading);
            } else {
                // Generate ID if missing (fallback)
                const text = heading.textContent.trim();
                const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s_-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                if (id) {
                    heading.id = id;
                    headingMap.set(id, heading);
                }
            }
        });

        // Smooth scrolling for TOC links
        tocLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = headingMap.get(targetId);
                
                if (targetElement) {
                    // Smooth scroll to target with offset for better positioning
                    const targetPosition = targetElement.offsetTop - 80;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active state immediately for better UX
                    updateActiveLink(this);
                } else {
                    console.warn('TOC: Target element not found for ID:', targetId);
                }
            });
        });

        // Update active link based on scroll position
        function updateActiveLink(activeLink = null) {
            // Remove active class from all links
            tocLinks.forEach(link => link.classList.remove('active'));
            
            if (activeLink) {
                // Set specific link as active
                activeLink.classList.add('active');
                return;
            }
            
            // Find the currently visible heading
            let activeHeading = null;
            const scrollPosition = window.scrollY + 100; // Add offset for better detection
            
            // Check headings from top to bottom
            for (const heading of headings) {
                if (heading.offsetTop <= scrollPosition) {
                    activeHeading = heading;
                } else {
                    break;
                }
            }
            
            if (activeHeading && activeHeading.id) {
                // Find corresponding TOC link
                const activeLink = tocContainer.querySelector(`a[href="#${activeHeading.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }

        // Throttled scroll handler for better performance
        let scrollTimeout;
        function handleScroll() {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(updateActiveLink, 10);
        }

        // Listen for scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial update on page load
        setTimeout(updateActiveLink, 100);

        // Handle resize events to recalculate positions
        window.addEventListener('resize', function() {
            setTimeout(updateActiveLink, 250);
        }, { passive: true });
    });
})();