import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadFile, sanitizeFilename } from '../../../src/lib/utils/file-download';

// Mock document and URL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

beforeEach(() => {
	// Reset mocks
	vi.clearAllMocks();

	// Mock URL
	vi.stubGlobal('URL', {
		createObjectURL: mockCreateObjectURL,
		revokeObjectURL: mockRevokeObjectURL
	});

	// Mock document methods
	vi.spyOn(document, 'createElement').mockImplementation((tag) => {
		if (tag === 'a') {
			return {
				href: '',
				download: '',
				click: mockClick
			} as unknown as HTMLAnchorElement;
		}
		return document.createElement(tag as keyof HTMLElementTagNameMap);
	});

	vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
	vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

describe('file-download', () => {
	describe('downloadFile', () => {
		it('should create download link and trigger download', () => {
			const blob = new Blob(['test content'], { type: 'text/plain' });
			const filename = 'test.txt';

			mockCreateObjectURL.mockReturnValue('blob:test-url');

			downloadFile(blob, filename);

			expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
			expect(document.createElement).toHaveBeenCalledWith('a');
			expect(mockAppendChild).toHaveBeenCalled();
			expect(mockClick).toHaveBeenCalled();
			expect(mockRemoveChild).toHaveBeenCalled();
			expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
		});

		it('should set correct href and download attributes', () => {
			const blob = new Blob(['content'], { type: 'application/json' });
			const filename = 'data.json';

			let createdLink: any;
			vi.mocked(document.createElement).mockImplementation((tag) => {
				if (tag === 'a') {
					createdLink = { href: '', download: '', click: mockClick };
					return createdLink;
				}
				return document.createElement(tag as keyof HTMLElementTagNameMap);
			});

			mockCreateObjectURL.mockReturnValue('blob:url');

			downloadFile(blob, filename);

			expect(createdLink.href).toBe('blob:url');
			expect(createdLink.download).toBe(filename);
		});
	});

	describe('sanitizeFilename', () => {
		it('should convert to lowercase', () => {
			expect(sanitizeFilename('TestFile')).toBe('testfile');
			expect(sanitizeFilename('FILE')).toBe('file');
		});

		it('should replace non-alphanumeric characters with underscores', () => {
			expect(sanitizeFilename('file with spaces')).toBe('file_with_spaces');
			expect(sanitizeFilename('file@#$%^&*()')).toBe('file_________');
			expect(sanitizeFilename('file.name.ext')).toBe('file_name_ext');
		});

		it('should handle mixed case and special characters', () => {
			expect(sanitizeFilename('My Awesome File!')).toBe('my_awesome_file_');
			expect(sanitizeFilename('test-123_file.name')).toBe('test_123_file_name');
		});

		it('should preserve alphanumeric characters', () => {
			expect(sanitizeFilename('abc123')).toBe('abc123');
			expect(sanitizeFilename('Test123File')).toBe('test123file');
		});

		it('should handle empty string', () => {
			expect(sanitizeFilename('')).toBe('');
		});

		it('should handle strings with only special characters', () => {
			expect(sanitizeFilename('@#$%')).toBe('____');
		});
	});
});
