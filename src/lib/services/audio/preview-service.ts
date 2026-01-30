import type { PreviewNoteSupport } from '../../chips/base/processor';
import type { ChipSchema } from '../../chips/base/schema';
import type { Pattern } from '../../models/song';

export class PreviewService {
	playFromContext(
		processor: PreviewNoteSupport,
		pattern: Pattern,
		_channelIndex: number,
		currentRow: number,
		_schema: ChipSchema,
		_useCurrentRowNote: boolean = false
	): number | undefined {
		processor.playPreviewRow(pattern, currentRow);
		return -1;
	}

	stopNote(processor: PreviewNoteSupport, channel: number | undefined): void {
		processor.stopPreviewNote(channel);
	}
}
