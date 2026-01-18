export interface PatternEditorColors {
	patternBg: string;
	patternText: string;
	patternEmpty: string;
	patternEmptySelected: string;
	patternNote: string;
	patternInstrument: string;
	patternEffect: string;
	patternEnvelope: string;
	patternNoise: string;
	patternHeader: string;
	patternSelected: string;
	patternCellSelected: string;
	patternRowNum: string;
	patternAlternate: string;
	patternAlternateEmpty: string;
	patternTable: string;
	patternRowNumAlternate: string;
	patternEditing: string;
	patternNoteOff: string;
	patternTableOff: string;
}

export interface PatternOrderColors {
	orderBg: string;
	orderText: string;
	orderEmpty: string;
	orderSelected: string;
	orderHovered: string;
	orderAlternate: string;
	orderBorder: string;
}

export interface AppColors {
	appBackground: string;
	appSurface: string;
	appSurfaceSecondary: string;
	appSurfaceHover: string;
	appSurfaceActive: string;
	appTextPrimary: string;
	appTextSecondary: string;
	appTextTertiary: string;
	appTextMuted: string;
	appBorder: string;
	appBorderHover: string;
	appPrimary: string;
	appPrimaryHover: string;
	appSecondary: string;
	appSecondaryHover: string;
}

export interface ThemeColors extends PatternEditorColors, PatternOrderColors, AppColors {}

export interface Theme {
	id: string;
	name: string;
	colors: ThemeColors;
	isCustom?: boolean;
}

export interface ThemeExportFormat {
	version: string;
	theme: Theme;
}
