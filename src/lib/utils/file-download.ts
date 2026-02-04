export function downloadFile(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	downloadFile(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

export function pickFileAsText(accept = '.json'): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) {
				reject(new Error('No file selected'));
				return;
			}
			try {
				resolve(await file.text());
			} catch (err) {
				reject(err);
			}
		};
		input.oncancel = () => reject(new Error('No file selected'));
		input.click();
	});
}

export function sanitizeFilename(name: string): string {
	return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
