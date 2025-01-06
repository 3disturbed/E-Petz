
export async function fetchAndUpdateInventory() {
    try {
        const response = await fetch('/api/inventory', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionKey')}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            updateInventoryDisplay(data.inventory);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

export function updateInventoryDisplay(inventory) {
    const itemsList = document.getElementById('itemsList');
    const filtersList = document.getElementById('itemTypeFilters');
    const coinDisplay = document.getElementById('coinCount');
    
    coinDisplay.textContent = inventory.coins;

    // Get unique item types
    const itemTypes = [...new Set(inventory.items.map(item => item.type))];
    
    // Create filters with tooltips
    filtersList.innerHTML = `
        <button class="filter-button active" data-type="all">All Items</button>
        ${itemTypes.map(type => `
            <button class="filter-button" data-type="${type}">${type}</button>
        `).join('')}
    `;

    // Add filter click handlers and tooltips
    filtersList.querySelectorAll('.filter-button').forEach(button => {
        const type = button.dataset.type;
        
        // Add tooltip
        tooltip.attachToElement(button, getFilterTooltip(type));

        // Add click handler
        button.addEventListener('click', () => {
            filtersList.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            displayFilteredItems(inventory.items, type);
        });
    });

    // Initial display of all items
    displayFilteredItems(inventory.items, 'all');
}

export function displayFilteredItems(items, filterType) {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    const filteredItems = filterType === 'all' 
        ? items 
        : items.filter(item => item.type === filterType);

    filteredItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-entry';
        itemElement.setAttribute('data-type', item.type);
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="item-icon">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                ${item.quantity > 1 ? `<div class="item-quantity">x${item.quantity}</div>` : ''}
            </div>
            <button class="item-action" onclick="handleItemAction('${item.id}')">${getItemActionButton(item)}</button>
        `;

        // Attach tooltip to the item element
        tooltip.attachToElement(itemElement, item.description);

        itemsList.appendChild(itemElement);
    });
}

export function handleItemAction(itemId) {
    // Handle item usage based on type
    console.log('Using item:', itemId);
    // Implement item usage logic here
}

function getFilterTooltip(type) {
    switch(type) {
        case 'Egg':
            return 'View all eggs that can hatch into pets';
        case 'Food':
            return 'View all food items to feed your pets';
        case 'Toy':
            return 'View all toys to play with your pets';
        case 'Cosmetic':
            return 'View all cosmetic items and accessories';
        default:
            return 'View all items in your inventory';
    }
}

function getItemActionButton(item) {
    // Customize button text based on item type
    switch(item.type) {
        case 'food':
            return 'Feed';
        case 'toy':
            return 'Play';
        case 'cosmetic':
            return 'Wear';
        default:
            return 'Use';
    }
}