export class StringManipulation {
	static replaceCharAtOffset(str: string, offset: number, char: string): string {
		return str.substring(0, offset) + char + str.substring(offset + 1);
	}
}
