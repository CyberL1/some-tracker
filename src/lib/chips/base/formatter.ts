import type { PatternFormatter } from './formatter-interface';
import type { ChipSchema, ChipField } from './schema';
import type { GenericRow, GenericPatternRow } from '../../models/song/generic';
import { formatHex, formatSymbol, parseHex, parseSymbol } from './field-formatters';
import { NoteName } from '../../models/song';
import { formatNoteFromEnum } from '../../utils/note-utils';

export abstract class BaseFormatter implements PatternFormatter {
	formatRow(
		patternRow: GenericPatternRow,
		channels: GenericRow[],
		rowIndex: number,
		schema: ChipSchema
	): string {
		let result = this.getRowNumber(rowIndex) + ' ';

		if (schema.globalTemplate && schema.globalFields) {
			result +=
				this.formatTemplate(schema.globalTemplate, patternRow, schema.globalFields) + ' ';
		}

		for (const channel of channels) {
			result += this.formatTemplate(schema.template, channel, schema.fields) + ' ';
		}

		return result.trim();
	}

	parseRow(
		rowString: string,
		schema: ChipSchema
	): {
		patternRow: GenericPatternRow;
		channels: GenericRow[];
	} {
		const patternRow: GenericPatternRow = {};
		const channels: GenericRow[] = [];

		const parts = rowString.split(/\s+/);
		let partIndex = 1;

		if (schema.globalTemplate && schema.globalFields) {
			const spaceCount = (schema.globalTemplate.match(/\s/g) || []).length;
			const globalParts: string[] = [];
			for (let i = 0; i <= spaceCount && partIndex < parts.length; i++) {
				globalParts.push(parts[partIndex] || '');
				partIndex++;
			}
			const globalString = globalParts.join(' ');
			const globalMatch = this.parseTemplate(
				globalString,
				schema.globalTemplate,
				schema.globalFields
			);
			Object.assign(patternRow, globalMatch);
		}

		const spaceCount = (schema.template.match(/\s/g) || []).length;
		while (partIndex < parts.length) {
			const channelParts: string[] = [];
			for (let i = 0; i <= spaceCount && partIndex < parts.length; i++) {
				channelParts.push(parts[partIndex] || '');
				partIndex++;
			}
			const channelString = channelParts.join(' ');
			if (channelString) {
				const channelMatch = this.parseTemplate(
					channelString,
					schema.template,
					schema.fields
				);
				channels.push(channelMatch);
			}
		}

		return { patternRow, channels };
	}

	protected formatTemplate(
		template: string,
		data: GenericRow | GenericPatternRow,
		fields: Record<string, ChipField>
	): string {
		let result = '';
		let i = 0;

		while (i < template.length) {
			if (template[i] === '{') {
				const end = template.indexOf('}', i);
				if (end !== -1) {
					const key = template.substring(i + 1, end);
					const field = fields[key];
					if (field) {
						const value = data[key];
						if ((key === 'effect' || key === 'envelopeEffect') && typeof value === 'object' && value !== null) {
							result += this.formatEffect(
								value as { effect: number; delay: number; parameter: number }
							);
						} else {
							result += this.formatField(value, field);
						}
					}
					i = end + 1;
				} else {
					result += template[i];
					i++;
				}
			} else {
				result += template[i];
				i++;
			}
		}

		return result;
	}

	protected parseTemplate(
		input: string,
		template: string,
		fields: Record<string, ChipField>
	): GenericRow {
		const result: GenericRow = {};

		const fieldKeys: string[] = [];
		const regexParts: string[] = [];
		let lastWasField = false;

		for (let i = 0; i < template.length; i++) {
			if (template[i] === '{') {
				const end = template.indexOf('}', i);
				if (end !== -1) {
					const key = template.substring(i + 1, end);
					const field = fields[key];
					if (field) {
						fieldKeys.push(key);
						regexParts.push(`(.{${field.length}})`);
						lastWasField = true;
					}
					i = end;
				}
			} else if (template[i] === ' ') {
				if (lastWasField) {
					regexParts.push('\\s*');
					lastWasField = false;
				}
			} else {
				lastWasField = false;
			}
		}

		const regex = new RegExp('^' + regexParts.join('') + '$');
		const match = input.replace(/\s+/g, ' ').trim().match(regex);

		if (match) {
			fieldKeys.forEach((key, i) => {
				const field = fields[key];
				if (field) {
					if (key === 'effect' || key === 'envelopeEffect') {
						result[key] = this.parseEffect(match[i + 1]) as unknown as
							| string
							| number
							| null
							| undefined;
					} else {
						result[key] = this.parseField(match[i + 1], field);
					}
				}
			});
		}

		return result;
	}

	protected formatField(
		value: number | string | null | undefined,
		field: { type: string; length: number }
	): string {
		if (
			typeof value === 'string' &&
			value !== '' &&
			isNaN(Number(value)) &&
			field.type !== 'note'
		) {
			return '.'.repeat(field.length);
		}

		switch (field.type) {
			case 'hex':
				return formatHex(value, field.length);
			case 'symbol':
				return formatSymbol(value, field.length);
			case 'note':
				return this.formatNote(value, field);
			default:
				return String(value || '').padStart(field.length, '.');
		}
	}

	protected parseField(value: string, field: { type: string; length: number }): number | string {
		if (value === '.'.repeat(field.length)) return 0;
		switch (field.type) {
			case 'hex':
				return parseHex(value, field.length);
			case 'symbol':
				return parseSymbol(value, field.length);
			case 'note':
				return value;
			default:
				return parseInt(value, 10) || 0;
		}
	}

	protected formatNote(
		value: number | string | null | undefined | { name: number; octave: number },
		field: { type: string; length: number }
	): string {
		if (typeof value === 'string') {
			return value.length === field.length ? value : value.padEnd(field.length, ' ');
		}
		const formatted = this.formatNoteValue(value);
		return formatted.length === field.length ? formatted : formatted.padEnd(field.length, ' ');
	}

	protected formatNoteValue(
		value: number | null | undefined | { name: number; octave: number }
	): string {
		if (typeof value === 'object' && value !== null && 'name' in value && 'octave' in value) {
			return this.formatNoteFromEnum(value.name, value.octave);
		}
		return String(value || '---');
	}

	protected formatNoteFromEnum(noteName: NoteName, octave: number): string {
		return formatNoteFromEnum(noteName, octave);
	}

	protected getRowNumber(rowIndex: number): string {
		return rowIndex.toString(16).toUpperCase().padStart(2, '0');
	}

	protected formatEffect(
		effect: { effect: number; delay: number; parameter: number } | null | undefined
	): string {
		if (!effect) return '...';
		let type: string;
		if (effect.effect === 0) {
			type = '.';
		} else if (effect.effect === 'S'.charCodeAt(0)) {
			type = 'S';
		} else {
			type = effect.effect.toString(16).toUpperCase();
		}
		const param = formatHex(effect.parameter, 2);
		return type + param;
	}

	protected parseEffect(value: string): { effect: number; delay: number; parameter: number } {
		let type: number;
		const typeChar = value[0];
		if (typeChar === '.') {
			type = 0;
		} else if (typeChar === 'S' || typeChar === 's') {
			type = 'S'.charCodeAt(0);
		} else {
			type = parseInt(typeChar, 16) || 0;
		}
		const param = parseInt((value.slice(1, 3) || '00').replace(/\./g, '0'), 16) || 0;
		return { effect: type, delay: 0, parameter: param };
	}

	getColorForField(fieldKey: string, schema: ChipSchema): string {
		const field = schema.fields[fieldKey] || schema.globalFields?.[fieldKey];
		if (field?.color) {
			return field.color;
		}
		return 'patternText';
	}
}

