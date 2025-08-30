/**
 * Table of Contents - Click to scroll with simplified active state
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const tocContainer = document.querySelector('.table-of-contents');
        if (!tocContainer) return;

        // Handle empty TOC
        const hasToC = document.querySelector('.container.has-toc');
        if (hasToC && (!tocContainer.querySelector('a') || tocContainer.innerHTML.trim() === '')) {
            hasToC.classList.add('toc-empty');
            return;
        }

        // Get all TOC links
        const tocLinks = tocContainer.querySelectorAll('a[href^="#"]');
        if (tocLinks.length === 0) return;

        // Add click handlers to TOC links
        tocLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default anchor behavior
                
                // Get target heading ID
                const targetId = this.getAttribute('href').substring(1);
                console.log('TOC: Clicked link to', targetId);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Calculate scroll position using your formula:
                    // current scroll position + heading's position relative to viewport
                    const rect = targetElement.getBoundingClientRect();
                    const targetScrollPosition = window.scrollY + rect.top - 23;

                    console.log('Target scroll position:', window.scrollY, rect.top);
                    
                    const maxScrollPosition = document.documentElement.scrollHeight - window.innerHeight;
                    console.log('Max scroll position:', document.documentElement.scrollHeight, window.innerHeight);
                    const finalScrollPosition = Math.max(0, Math.min(targetScrollPosition, maxScrollPosition));
                    
                    // Scroll to calculated position
                    window.scrollTo({
                        top: finalScrollPosition,
                        behavior: 'smooth'
                    });
                    
                    // Set this link as active (simplified active state management)
                    tocLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                } else {
                    console.warn('TOC: Target heading not found:', targetId);
                }
            });
        });
    });
})();