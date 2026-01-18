import type { Theme, ThemeColors } from '../../types/theme';
import { darkenColor } from '../../utils/colors';

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
	patternBg: '--color-pattern-bg',
	patternText: '--color-pattern-text',
	patternEmpty: '--color-pattern-empty',
	patternEmptySelected: '--color-pattern-empty-selected',
	patternNote: '--color-pattern-note',
	patternInstrument: '--color-pattern-instrument',
	patternEffect: '--color-pattern-effect',
	patternEnvelope: '--color-pattern-envelope',
	patternNoise: '--color-pattern-noise',
	patternHeader: '--color-pattern-header',
	patternSelected: '--color-pattern-selected',
	patternCellSelected: '--color-pattern-cell-selected',
	patternRowNum: '--color-pattern-row-num',
	patternAlternate: '--color-pattern-alternate',
	patternAlternateEmpty: '--color-pattern-alternate-empty',
	patternTable: '--color-pattern-table',
	patternRowNumAlternate: '--color-pattern-row-num-alternate',
	patternEditing: '--color-pattern-editing',
	patternNoteOff: '--color-pattern-note-off',
	patternTableOff: '--color-pattern-table-off',
	orderBg: '--color-order-bg',
	orderText: '--color-order-text',
	orderEmpty: '--color-order-empty',
	orderSelected: '--color-order-selected',
	orderHovered: '--color-order-hovered',
	orderAlternate: '--color-order-alternate',
	orderBorder: '--color-order-border',
	appBackground: '--color-app-background',
	appSurface: '--color-app-surface',
	appSurfaceSecondary: '--color-app-surface-secondary',
	appSurfaceHover: '--color-app-surface-hover',
	appSurfaceActive: '--color-app-surface-active',
	appTextPrimary: '--color-app-text-primary',
	appTextSecondary: '--color-app-text-secondary',
	appTextTertiary: '--color-app-text-tertiary',
	appTextMuted: '--color-app-text-muted',
	appBorder: '--color-app-border',
	appBorderHover: '--color-app-border-hover',
	appPrimary: '--color-app-primary',
	appPrimaryHover: '--color-app-primary-hover',
	appSecondary: '--color-app-secondary',
	appSecondaryHover: '--color-app-secondary-hover'
};

export class ThemeService {
	private colorChangeListeners: Set<() => void> = new Set();

	applyTheme(theme: Theme | null): void {
		if (!theme) return;

		const root = document.documentElement;
		const colors = theme.colors;

		for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
			const colorKey = key as keyof ThemeColors;
			let colorValue: string;

			if (colorKey === 'patternNoteOff') {
				colorValue = darkenColor(colors.patternNote, 60);
			} else if (colorKey === 'patternTableOff') {
				colorValue = darkenColor(colors.patternTable, 60);
			} else {
				colorValue = colors[colorKey];
			}

			root.style.setProperty(cssVar, colorValue);
		}

		this.notifyColorChange();
	}

	applyPreviewColors(colors: ThemeColors | null): void {
		if (!colors) {
			return;
		}

		const root = document.documentElement;

		for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
			const colorKey = key as keyof ThemeColors;
			let colorValue: string;

			if (colorKey === 'patternNoteOff') {
				colorValue = darkenColor(colors.patternNote, 60);
			} else if (colorKey === 'patternTableOff') {
				colorValue = darkenColor(colors.patternTable, 60);
			} else {
				colorValue = colors[colorKey];
			}

			root.style.setProperty(cssVar, colorValue);
		}

		this.notifyColorChange();
	}

	onColorChange(callback: () => void): () => void {
		this.colorChangeListeners.add(callback);
		return () => {
			this.colorChangeListeners.delete(callback);
		};
	}

	private notifyColorChange(): void {
		this.colorChangeListeners.forEach((callback) => callback());
	}
}

export const themeService = new ThemeService();
