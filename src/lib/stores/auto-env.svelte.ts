export const AUTO_ENV_PRESETS = [
	{ numerator: 1, denominator: 1, label: '1:1' },
	{ numerator: 3, denominator: 4, label: '3:4' },
	{ numerator: 1, denominator: 2, label: '1:2' },
	{ numerator: 1, denominator: 4, label: '1:4' },
	{ numerator: 3, denominator: 1, label: '3:1' },
	{ numerator: 5, denominator: 2, label: '5:2' },
	{ numerator: 2, denominator: 1, label: '2:1' },
	{ numerator: 3, denominator: 2, label: '3:2' }
] as const;

export interface AutoEnvRatio {
	numerator: number;
	denominator: number;
	label?: string;
}

class AutoEnvStore {
	enabled = $state(false);
	numerator = $state(1);
	denominator = $state(1);

	get currentRatio(): AutoEnvRatio {
		return {
			numerator: this.numerator,
			denominator: this.denominator,
			label: `${this.numerator}:${this.denominator}`
		};
	}

	toggle(): void {
		this.enabled = !this.enabled;
		if (this.enabled && (this.numerator === 0 || this.denominator === 0)) {
			this.numerator = 1;
			this.denominator = 1;
		}
	}

	setNumerator(value: number): void {
		if (value > 0 && value <= 999) {
			this.numerator = value;
		}
	}

	setDenominator(value: number): void {
		if (value > 0 && value <= 999) {
			this.denominator = value;
		}
	}

	setPreset(preset: { numerator: number; denominator: number }): void {
		this.numerator = preset.numerator;
		this.denominator = preset.denominator;
		if (!this.enabled) {
			this.enabled = true;
		}
	}

	reset(): void {
		this.enabled = false;
		this.numerator = 1;
		this.denominator = 1;
	}
}

export const autoEnvStore = new AutoEnvStore();
