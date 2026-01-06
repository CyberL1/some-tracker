import type { Action } from '../models/actions';

const MAX_HISTORY_SIZE = 500;

class UndoRedoStore {
	private undoStack: Action[] = $state([]);
	private redoStack: Action[] = $state([]);

	get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.redoStack.length > 0;
	}

	pushAction(action: Action): void {
		this.undoStack.push(action);
		this.redoStack = [];

		if (this.undoStack.length > MAX_HISTORY_SIZE) {
			this.undoStack.shift();
		}
	}

	undo(): void {
		const action = this.undoStack.pop();
		if (!action) return;

		action.undo();
		this.redoStack.push(action);
	}

	redo(): void {
		const action = this.redoStack.pop();
		if (!action) return;

		action.execute();
		this.undoStack.push(action);
	}

	clear(): void {
		this.undoStack = [];
		this.redoStack = [];
	}

	getUndoStackSize(): number {
		return this.undoStack.length;
	}

	getRedoStackSize(): number {
		return this.redoStack.length;
	}
}

export const undoRedoStore = new UndoRedoStore();
