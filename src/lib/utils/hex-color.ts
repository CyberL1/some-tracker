export function parseHexColor(input: string): string | null {
	const raw = input.replace(/^#/, '').trim();
	if (raw.length !== 6 || !/^[0-9a-fA-F]+$/.test(raw)) return null;
	return '#' + raw.toLowerCase();
}

export function normalizeHexColor(hex: string): string {
	const parsed = parseHexColor(hex);
	return parsed ?? hex;
}
