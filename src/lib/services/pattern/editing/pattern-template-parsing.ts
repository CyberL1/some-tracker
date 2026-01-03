import type { Chip } from '../../../chips/types';

export class PatternTemplateParser {
	static skipSpaces(rowString: string, pos: number): number {
		let currentPos = pos;
		while (currentPos < rowString.length && rowString[currentPos] === ' ') {
			currentPos++;
		}
		return currentPos;
	}

	static skipRowNumber(rowString: string, pos: number): number {
		let currentPos = this.skipSpaces(rowString, pos);
		while (currentPos < rowString.length && rowString[currentPos] !== ' ') {
			currentPos++;
		}
		return this.skipSpaces(rowString, currentPos);
	}

	static parseTemplate(
		template: string,
		fields: Record<string, { length: number }>,
		callback: (key: string, field: { length: number }, isSpace: boolean) => void
	): void {
		let templatePos = 0;
		while (templatePos < template.length) {
			if (template[templatePos] === '{') {
				const end = template.indexOf('}', templatePos);
				if (end !== -1) {
					const key = template.substring(templatePos + 1, end);
					const field = fields[key];
					if (field) {
						callback(key, field, false);
					}
					templatePos = end + 1;
				} else {
					templatePos++;
				}
			} else if (template[templatePos] === ' ') {
				callback('', { length: 0 }, true);
				templatePos++;
			} else {
				templatePos++;
			}
		}
	}

	static parseGlobalTemplate(
		rowString: string,
		startPos: number,
		schema: Chip['schema'],
		callback?: (key: string, field: { length: number }, pos: number) => number
	): number {
		let pos = startPos;
		if (!schema.globalTemplate || !schema.globalFields) {
			return pos;
		}

		this.parseTemplate(schema.globalTemplate, schema.globalFields, (key, field, isSpace) => {
			if (isSpace) {
				pos++;
			} else if (callback) {
				pos = callback(key, field, pos);
			} else {
				pos += field.length;
			}
		});

		return this.skipSpaces(rowString, pos);
	}

	static calculateChannelIndexForField(
		fieldKey: string,
		charIndex: number,
		rowString: string,
		schema: Chip['schema']
	): number {
		let pos = this.skipRowNumber(rowString, 0);
		pos = this.parseGlobalTemplate(rowString, pos, schema);

		const channelStart = pos;
		let channelTemplateLength = 0;
		this.parseTemplate(schema.template, schema.fields, (key, field, isSpace) => {
			if (isSpace) {
				channelTemplateLength++;
			} else {
				channelTemplateLength += field.length;
			}
		});

		if (channelTemplateLength === 0) {
			return 0;
		}

		const relativePos = charIndex - channelStart;
		const channelIndex = Math.floor(relativePos / channelTemplateLength);
		return Math.max(0, channelIndex);
	}

	static findFieldStartPositionInRowString(
		rowString: string,
		fieldKey: string,
		charIndex: number,
		schema: Chip['schema']
	): number {
		const segments: Array<{ start: number; end: number; fieldKey: string }> = [];
		let pos = this.skipRowNumber(rowString, 0);

		pos = this.parseGlobalTemplate(rowString, pos, schema, (key, field, currentPos) => {
			segments.push({
				start: currentPos,
				end: currentPos + field.length,
				fieldKey: key
			});
			return currentPos + field.length;
		});

		while (pos < rowString.length) {
			pos = this.skipSpaces(rowString, pos);
			if (pos >= rowString.length) break;

			let channelStart = pos;
			this.parseTemplate(schema.template, schema.fields, (key, field, isSpace) => {
				if (isSpace) {
					if (pos < rowString.length && rowString[pos] === ' ') {
						pos++;
					}
				} else {
					segments.push({
						start: pos,
						end: pos + field.length,
						fieldKey: key
					});
					pos += field.length;
				}
			});

			if (pos === channelStart) break;
		}

		const segment = segments.find(
			(s) => charIndex >= s.start && charIndex < s.end && s.fieldKey === fieldKey
		);
		return segment ? segment.start : charIndex;
	}
}
