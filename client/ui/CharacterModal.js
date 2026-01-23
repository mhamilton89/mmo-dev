/**
 * Character/Inventory Modal UI
 * Handles the character equipment paper doll and inventory display
 */

class CharacterModal {
    constructor() {
        console.log('[MODAL] CharacterModal constructor called');

        this.modal = document.getElementById('character-modal');
        this.closeButton = document.getElementById('character-modal-close');
        this.equipmentSlots = document.getElementById('equipment-slots');
        this.inventoryItems = document.getElementById('modal-inventory-items');
        this.contextMenu = document.getElementById('item-context-menu');

        console.log('[MODAL] Elements found:', {
            modal: !!this.modal,
            closeButton: !!this.closeButton,
            equipmentSlots: !!this.equipmentSlots,
            inventoryItems: !!this.inventoryItems,
            contextMenu: !!this.contextMenu
        });

        this.isOpen = false;
        this.currentCharacter = null;
        this.currentInventory = [];
        this.currentEquipment = {};

        this.selectedItem = null; // For context menu

        this.setupEventListeners();
        console.log('[MODAL] Event listeners set up');
    }

    setupEventListeners() {
        // Close button
        this.closeButton.addEventListener('click', () => this.close());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // I key to toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                // Don't toggle if chat is focused
                const chatInput = document.getElementById('chat-input');
                if (document.activeElement === chatInput) return;

                this.toggle();
            }
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Hide context menu on click outside
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Context menu actions
        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleContextMenuAction(action);
            });
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.modal.style.display = 'block';
        this.isOpen = true;
        this.refresh();
    }

    close() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        this.hideContextMenu();
    }

    /**
     * Update the modal with current character data
     */
    updateCharacter(character, inventory, equipment) {
        this.currentCharacter = character;
        this.currentInventory = inventory || [];
        this.currentEquipment = equipment || {};

        if (this.isOpen) {
            this.refresh();
        }
    }

    /**
     * Refresh the entire modal display
     */
    refresh() {
        this.renderEquipmentSlots();
        this.renderInventoryItems();
    }

    /**
     * Render equipment slots with current equipment
     */
    renderEquipmentSlots() {
        const slots = this.equipmentSlots.querySelectorAll('.equipment-slot');

        slots.forEach(slot => {
            const slotName = slot.dataset.slot;
            const icon = slot.querySelector('.slot-icon');
            const equipped = this.currentEquipment[slotName];

            // Clear slot
            icon.textContent = '';
            icon.classList.remove('has-item');
            slot.classList.remove('equipped');

            if (equipped && equipped.name) {
                // Show equipped item (placeholder icon for now)
                icon.textContent = this.getItemIcon(equipped.name);
                icon.classList.add('has-item');
                slot.classList.add('equipped');
                slot.title = equipped.name;

                // Right-click to unequip
                slot.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, equipped.name, slotName, true);
                };
            } else {
                slot.title = slotName.charAt(0).toUpperCase() + slotName.slice(1);
                slot.oncontextmenu = null;
            }
        });
    }

    /**
     * Render inventory items
     */
    renderInventoryItems() {
        this.inventoryItems.innerHTML = '';

        this.currentInventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.dataset.itemName = item.item_name;

            // Check if item is currently equipped
            const isEquipped = Object.values(this.currentEquipment).some(eq =>
                eq && eq.name === item.item_name
            );

            if (isEquipped) {
                itemDiv.classList.add('equipped');
            }

            // Icon
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            icon.textContent = this.getItemIcon(item.item_name);
            itemDiv.appendChild(icon);

            // Name
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = this.formatItemName(item.item_name);
            itemDiv.appendChild(name);

            // Tooltip
            itemDiv.title = item.item_name;

            // Right-click to equip/unequip
            itemDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, item.item_name, null, isEquipped);
            });

            this.inventoryItems.appendChild(itemDiv);
        });
    }

    /**
     * Show context menu at mouse position
     */
    showContextMenu(e, itemName, slotName, isEquipped) {
        console.log('[MENU] Showing context menu:', { itemName, slotName, isEquipped });
        this.selectedItem = { itemName, slotName, isEquipped };

        // Update context menu options
        const equipOption = this.contextMenu.querySelector('[data-action="equip"]');
        const unequipOption = this.contextMenu.querySelector('[data-action="unequip"]');

        if (isEquipped) {
            equipOption.style.display = 'none';
            unequipOption.style.display = 'block';
        } else {
            equipOption.style.display = 'block';
            unequipOption.style.display = 'none';
        }

        // Position context menu
        this.contextMenu.style.left = e.pageX + 'px';
        this.contextMenu.style.top = e.pageY + 'px';
        this.contextMenu.style.display = 'block';
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.selectedItem = null;
    }

    /**
     * Handle context menu action (equip/unequip)
     */
    handleContextMenuAction(action) {
        console.log('[MENU] Context menu action:', action, 'selectedItem:', this.selectedItem);

        if (!this.selectedItem) {
            console.error('[MENU] No selected item!');
            return;
        }

        const { itemName, slotName, isEquipped } = this.selectedItem;

        if (action === 'equip' && !isEquipped) {
            console.log('[MENU] Calling equipItem for:', itemName);
            this.equipItem(itemName);
        } else if (action === 'unequip' && isEquipped) {
            console.log('[MENU] Calling unequipItem for:', slotName || this.getSlotForItem(itemName));
            this.unequipItem(slotName || this.getSlotForItem(itemName));
        }

        this.hideContextMenu();
    }

    /**
     * Equip an item from inventory
     */
    equipItem(itemName) {
        console.log('[EQUIP] Equipping item:', itemName);

        // Determine slot from item name
        const slot = this.getSlotForItem(itemName);
        console.log('[EQUIP] Determined slot:', slot);

        if (!slot) {
            console.error('[EQUIP] Could not determine slot for item:', itemName);
            return;
        }

        // Send equip request to server
        if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
            console.log('[EQUIP] Sending equipItem message to server:', {
                type: 'equipItem',
                itemName: itemName,
                slot: slot
            });
            gameState.ws.send(JSON.stringify({
                type: 'equipItem',
                itemName: itemName,
                slot: slot
            }));
        } else {
            console.error('[EQUIP] WebSocket not open:', gameState.ws?.readyState);
        }
    }

    /**
     * Unequip an item to inventory
     */
    unequipItem(slot) {
        console.log('Unequipping slot:', slot);

        // Send unequip request to server
        if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
            gameState.ws.send(JSON.stringify({
                type: 'unequipItem',
                slot: slot
            }));
        }
    }

    /**
     * Get slot name from item name
     * Slot is determined by the FIRST WORD in the item name (before first underscore)
     */
    getSlotForItem(itemName) {
        // Split by underscore and get first word
        const firstWord = itemName.split('_')[0];

        // Map first word to slot
        const slotMap = {
            'weapon': 'weapon',
            'head': 'helmet',
            'helmet': 'helmet',
            'torso': 'armor',
            'chest': 'armor',
            'legs': 'legs',
            'boots': 'boots',
            'gloves': 'gloves',
            'arms': 'arms',
            'bracers': 'bracers',
            'shoulder': 'shoulder'
        };

        return slotMap[firstWord] || null;
    }

    /**
     * Get placeholder icon for item
     */
    getItemIcon(itemName) {
        // Use first word to determine icon
        const firstWord = itemName.split('_')[0];

        const iconMap = {
            'weapon': '⚔️',
            'head': '⛑️',
            'helmet': '⛑️',
            'torso': '🛡️',
            'chest': '🛡️',
            'legs': '👔',
            'boots': '👢',
            'gloves': '🧤',
            'arms': '💪',
            'bracers': '⚡',
            'shoulder': '🎯'
        };

        return iconMap[firstWord] || '❓';
    }

    /**
     * Format item name for display
     */
    formatItemName(itemName) {
        // Convert snake_case to Title Case
        return itemName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Initialize when DOM is ready
let characterModal;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[MODAL] Initializing CharacterModal (DOMContentLoaded)');
        characterModal = new CharacterModal();
        console.log('[MODAL] CharacterModal initialized:', characterModal);
    });
} else {
    console.log('[MODAL] Initializing CharacterModal (immediate)');
    characterModal = new CharacterModal();
    console.log('[MODAL] CharacterModal initialized:', characterModal);
}
