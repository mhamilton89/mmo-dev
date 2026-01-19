/**
 * RPGUI-styled progress bar for resource gathering
 * Shows hold-to-gather progress with hit markers
 */
class GatherProgressBar {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.progressFill = null;
        this.titleText = null;
        this.hitMarkers = [];
        this.progressTween = null;

        this.createProgressBar();
    }

    createProgressBar() {
        const width = 320;
        const height = 60;
        const barWidth = 280;
        const barHeight = 20;

        // Create container (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        this.container.setVisible(false);

        // Background panel (RPGUI-styled brown panel)
        const bg = this.scene.add.rectangle(0, 0, width, height, 0x3e2723);
        bg.setStrokeStyle(3, 0x8b7355);
        this.container.add(bg);

        // Title text
        this.titleText = this.scene.add.text(0, -15, 'Gathering... (0/3)', {
            fontFamily: 'Georgia, serif',
            fontSize: '16px',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        this.titleText.setOrigin(0.5, 0.5);
        this.container.add(this.titleText);

        // Progress bar background
        const barBg = this.scene.add.rectangle(0, 10, barWidth, barHeight, 0x1a1410);
        barBg.setStrokeStyle(2, 0x8b7355);
        this.container.add(barBg);

        // Progress fill (starts at 0 width)
        this.progressFill = this.scene.add.rectangle(-barWidth / 2, 10, 0, barHeight - 4, 0x4caf50);
        this.progressFill.setOrigin(0, 0.5);
        this.container.add(this.progressFill);

        // Hit markers (divide bar into thirds for 3 hits)
        for (let i = 1; i < 3; i++) {
            const markerX = -barWidth / 2 + (barWidth / 3) * i;
            const marker = this.scene.add.rectangle(markerX, 10, 2, barHeight, 0xffd700);
            marker.setAlpha(0.6);
            this.hitMarkers.push(marker);
            this.container.add(marker);
        }
    }

    /**
     * Show progress bar and start progress animation
     * @param {number} duration - Duration in milliseconds
     * @param {number} hitCount - Current hit count (0 for simple gathering)
     * @param {number} hitsRequired - Total hits required (1 for simple gathering)
     */
    show(duration, hitCount, hitsRequired) {
        // Position at bottom-center of screen
        const centerX = this.scene.cameras.main.width / 2;
        const bottomY = this.scene.cameras.main.height - 80;
        this.container.setPosition(centerX, bottomY);

        // Update title (simple text for single-hold gathering)
        this.titleText.setText('Gathering...');

        // Hide hit markers for simple gathering
        this.hitMarkers.forEach(marker => marker.setVisible(false));

        // Show container
        this.container.setVisible(true);

        // Animate progress fill from 0 to full width
        if (this.progressTween) {
            this.progressTween.stop();
        }

        this.progressFill.setDisplaySize(0, this.progressFill.height);

        this.progressTween = this.scene.tweens.add({
            targets: this.progressFill,
            displayWidth: 280,
            duration: duration,
            ease: 'Linear'
        });
    }

    /**
     * Update progress manually
     * @param {number} progress - Progress from 0 to 1
     * @param {number} hitCount - Current hit count
     * @param {number} hitsRequired - Total hits required
     */
    setProgress(progress, hitCount, hitsRequired) {
        if (this.progressTween) {
            this.progressTween.stop();
        }

        this.progressFill.setDisplaySize(280 * progress, this.progressFill.height);
        this.titleText.setText(`Gathering... (${hitCount}/${hitsRequired})`);
        this.updateHitMarkers(hitCount, hitsRequired);
    }

    /**
     * Update hit marker colors based on progress
     * @param {number} hitCount - Current hit count
     * @param {number} hitsRequired - Total hits required
     */
    updateHitMarkers(hitCount, hitsRequired) {
        this.hitMarkers.forEach((marker, index) => {
            const markerHit = index + 1;
            if (markerHit <= hitCount) {
                marker.setFillStyle(0x4caf50); // Green for completed
            } else {
                marker.setFillStyle(0xffd700); // Yellow for pending
            }
        });
    }

    /**
     * Hide progress bar
     */
    hide() {
        if (this.progressTween) {
            this.progressTween.stop();
        }
        this.container.setVisible(false);
        this.progressFill.setDisplaySize(0, this.progressFill.height);
    }

    /**
     * Flash green and hide after 300ms
     */
    flashSuccess() {
        this.progressFill.setFillStyle(0x4caf50); // Green

        this.scene.time.delayedCall(300, () => {
            this.hide();
        });
    }

    /**
     * Flash red and hide after 300ms
     */
    flashFailure() {
        this.progressFill.setFillStyle(0xf44336); // Red

        this.scene.time.delayedCall(300, () => {
            this.hide();
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.progressTween) {
            this.progressTween.stop();
        }
        if (this.container) {
            this.container.destroy();
        }
    }
}
