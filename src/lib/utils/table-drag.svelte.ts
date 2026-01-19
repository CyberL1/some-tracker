export function createTableDrag<TValue = number | boolean>() {
	let isDragging = $state(false);
	let dragType: string | null = $state(null);
	let dragValue: TValue | null = $state(null);

	function beginDrag(type: string, value: TValue, callback: (value: TValue) => void) {
		isDragging = true;
		dragType = type;
		dragValue = value;
		callback(value);
	}

	function dragOver(type: string, value: TValue, callback: (value: TValue) => void) {
		if (isDragging && dragType === type && dragValue !== null) {
			callback(value);
		}
	}

	function stopDrag() {
		isDragging = false;
		dragType = null;
		dragValue = null;
	}

	function setupCleanup() {
		$effect(() => {
			window.addEventListener('mouseup', stopDrag);
			return () => window.removeEventListener('mouseup', stopDrag);
		});
	}

	return {
		get isDragging() {
			return isDragging;
		},
		get dragType() {
			return dragType;
		},
		beginDrag,
		dragOver,
		stopDrag,
		setupCleanup
	};
}

export function createBooleanTableDrag<TField extends string>(
	updateCallback: (field: TField, value: boolean) => void
) {
	let isDragging = $state(false);
	let dragField: TField | null = $state(null);
	let dragValue: boolean | null = $state(null);

	function beginDragBoolean(field: TField, currentValue: boolean) {
		isDragging = true;
		dragField = field;
		dragValue = !currentValue;
		updateCallback(field, dragValue);
	}

	function dragOverBoolean(field: TField) {
		if (isDragging && dragField === field && dragValue !== null) {
			updateCallback(field, dragValue);
		}
	}

	function stopDrag() {
		isDragging = false;
		dragField = null;
		dragValue = null;
	}

	function setupCleanup() {
		$effect(() => {
			window.addEventListener('mouseup', stopDrag);
			return () => window.removeEventListener('mouseup', stopDrag);
		});
	}

	return {
		get isDragging() {
			return isDragging;
		},
		get dragField() {
			return dragField;
		},
		beginDragBoolean,
		dragOverBoolean,
		stopDrag,
		setupCleanup
	};
}

export function createValueTableDrag<TType extends string>(
	updateCallback: (type: TType, value: number) => void
) {
	let isDragging = $state(false);
	let dragMode: TType | null = $state(null);

	function beginDrag(mode: TType, value: number) {
		isDragging = true;
		dragMode = mode;
		updateCallback(mode, value);
	}

	function dragOver(mode: TType, value: number) {
		if (isDragging && dragMode === mode) {
			updateCallback(mode, value);
		}
	}

	function stopDrag() {
		isDragging = false;
		dragMode = null;
	}

	function setupCleanup() {
		$effect(() => {
			window.addEventListener('mouseup', stopDrag);
			return () => window.removeEventListener('mouseup', stopDrag);
		});
	}

	return {
		get isDragging() {
			return isDragging;
		},
		get dragMode() {
			return dragMode;
		},
		beginDrag,
		dragOver,
		stopDrag,
		setupCleanup
	};
}
