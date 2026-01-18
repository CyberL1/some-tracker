import { BUILTIN_THEMES } from '../config/themes';
import type { Theme, ThemeExportFormat } from '../types/theme';

const STORAGE_KEY_ACTIVE_THEME = 'active-theme-id';
const STORAGE_KEY_CUSTOM_THEMES = 'custom-themes';
const DEFAULT_THEME_ID = 'catppuccin-mocha';

class ThemeStore {
	private _state = $state({
		activeThemeId: DEFAULT_THEME_ID,
		customThemes: [] as Theme[],
		previewColors: null as Theme['colors'] | null
	});

	get state() {
		return this._state;
	}

	init(themeService?: { applyTheme: (theme: Theme) => void }): void {
		if (typeof window === 'undefined') return;

		const savedThemeId = localStorage.getItem(STORAGE_KEY_ACTIVE_THEME);
		const savedCustomThemes = localStorage.getItem(STORAGE_KEY_CUSTOM_THEMES);

		if (savedCustomThemes) {
			try {
				this._state.customThemes = JSON.parse(savedCustomThemes);
			} catch {
				this._state.customThemes = [];
			}
		}

		if (savedThemeId && this.getAllThemes().some((t) => t.id === savedThemeId)) {
			this._state.activeThemeId = savedThemeId;
		} else {
			this._state.activeThemeId = DEFAULT_THEME_ID;
		}

		const activeTheme = this.getActiveTheme();
		if (activeTheme && themeService) {
			themeService.applyTheme(activeTheme);
		}
	}

	getActiveTheme(): Theme | undefined {
		return this.getAllThemes().find((t) => t.id === this._state.activeThemeId);
	}

	setActiveTheme(themeId: string): void {
		const theme = this.getAllThemes().find((t) => t.id === themeId);
		if (!theme) return;

		this._state.activeThemeId = themeId;
		localStorage.setItem(STORAGE_KEY_ACTIVE_THEME, themeId);
	}

	getAllThemes(): Theme[] {
		return [...BUILTIN_THEMES, ...this._state.customThemes];
	}

	getCustomThemes(): Theme[] {
		return this._state.customThemes;
	}

	addCustomTheme(theme: Theme): void {
		const exists = this._state.customThemes.some((t) => t.id === theme.id);
		if (exists) {
			this.updateCustomTheme(theme.id, theme);
			return;
		}

		this._state.customThemes = [...this._state.customThemes, { ...theme, isCustom: true }];
		this.saveCustomThemes();
	}

	updateCustomTheme(themeId: string, theme: Theme): void {
		const index = this._state.customThemes.findIndex((t) => t.id === themeId);
		if (index === -1) return;

		this._state.customThemes[index] = { ...theme, isCustom: true };
		this._state.customThemes = [...this._state.customThemes];
		this.saveCustomThemes();
	}

	deleteCustomTheme(themeId: string): void {
		const theme = this._state.customThemes.find((t) => t.id === themeId);
		if (!theme || !theme.isCustom) return;

		this._state.customThemes = this._state.customThemes.filter((t) => t.id !== themeId);
		this.saveCustomThemes();

		if (this._state.activeThemeId === themeId) {
			this.setActiveTheme(DEFAULT_THEME_ID);
		}
	}

	setPreviewColors(colors: Theme['colors'] | null): void {
		this._state.previewColors = colors;
	}

	getPreviewColors(): Theme['colors'] | null {
		return this._state.previewColors;
	}

	exportTheme(themeId: string): string | null {
		const theme = this.getAllThemes().find((t) => t.id === themeId);
		if (!theme) return null;

		const exportData: ThemeExportFormat = {
			version: '1.0',
			theme
		};

		return JSON.stringify(exportData, null, 2);
	}

	importTheme(json: string): Theme | null {
		try {
			const data = JSON.parse(json) as ThemeExportFormat;

			if (!data.version || !data.theme) {
				throw new Error('Invalid theme format');
			}

			if (!data.theme.id || !data.theme.name || !data.theme.colors) {
				throw new Error('Invalid theme structure');
			}

			return {
				...data.theme,
				isCustom: true
			};
		} catch {
			return null;
		}
	}

	private saveCustomThemes(): void {
		localStorage.setItem(STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(this._state.customThemes));
	}
}

export const themeStore = new ThemeStore();
