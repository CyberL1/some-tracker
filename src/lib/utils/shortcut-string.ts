function keyFromEvent(event: KeyboardEvent): string {
	if (event.altKey) {
		const code = event.code;
		if (code.startsWith('Key')) {
			return code.slice(3).toLowerCase();
		}
		if (code.startsWith('Digit')) {
			return code.slice(5);
		}
		return code;
	}
	const key = event.key;
	if (key.length === 1 && key >= 'A' && key <= 'Z') {
		return key.toLowerCase();
	}
	return key;
}

export class ShortcutString {
	static fromEvent(event: KeyboardEvent): string {
		const parts: string[] = [];
		if (event.ctrlKey || event.metaKey) {
			parts.push('Mod');
		}
		if (event.altKey) {
			parts.push('Alt');
		}
		if (event.shiftKey) {
			parts.push('Shift');
		}
		parts.push(keyFromEvent(event));
		return parts.join('+');
	}

	static toDisplay(shortcut: string): string {
		const isMac =
			typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
		let result = shortcut
			.replace(/\bMod\b/g, isMac ? 'Cmd' : 'Ctrl')
			.replace(/\bAlt\b/g, isMac ? 'Option' : 'Alt');
		const segments = result.split('+');
		const keyPart = segments[segments.length - 1];
		if (keyPart.length === 1 && keyPart >= 'a' && keyPart <= 'z') {
			segments[segments.length - 1] = keyPart.toUpperCase();
			result = segments.join('+');
		}
		return result;
	}

	static normalizeForComparison(shortcut: string): string {
		const segments = shortcut.split('+');
		const keyPart = segments[segments.length - 1];
		if (keyPart.length === 1 && keyPart >= 'A' && keyPart <= 'Z') {
			segments[segments.length - 1] = keyPart.toLowerCase();
		}
		return segments.join('+');
	}
}
