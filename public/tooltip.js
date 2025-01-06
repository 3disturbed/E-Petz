class Tooltip {
    constructor() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'global-tooltip';
        document.body.appendChild(this.tooltip);
        this.hideTimeout = null;
        this.padding = 10; // Padding from mouse cursor
    }

    calculatePosition(mouseX, mouseY) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default position (bottom-right of cursor)
        let x = mouseX + this.padding;
        let y = mouseY + this.padding;

        // Check right edge
        if (x + tooltipRect.width > viewportWidth) {
            x = mouseX - tooltipRect.width - this.padding;
        }

        // Check bottom edge
        if (y + tooltipRect.height > viewportHeight) {
            y = mouseY - tooltipRect.height - this.padding;
        }

        // Ensure tooltip doesn't go off-screen
        x = Math.max(this.padding, Math.min(x, viewportWidth - tooltipRect.width - this.padding));
        y = Math.max(this.padding, Math.min(y, viewportHeight - tooltipRect.height - this.padding));

        return { x, y };
    }

    show(text, mouseX, mouseY) {
        clearTimeout(this.hideTimeout);
        this.tooltip.textContent = text;
        this.tooltip.style.opacity = '1';

        // First set position to get correct dimensions
        this.tooltip.style.left = '0px';
        this.tooltip.style.top = '0px';
        
        // Calculate optimal position
        const { x, y } = this.calculatePosition(mouseX, mouseY);
        
        // Set final position
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    hide() {
        this.hideTimeout = setTimeout(() => {
            this.tooltip.style.opacity = '0';
        }, 100);
    }

    attachToElement(element, text) {
        element.addEventListener('mousemove', (e) => {
            this.show(text, e.clientX, e.clientY);
        });

        element.addEventListener('mouseleave', () => {
            this.hide();
        });
    }
}

// Create global instance
const tooltip = new Tooltip();
window.tooltip = tooltip;
