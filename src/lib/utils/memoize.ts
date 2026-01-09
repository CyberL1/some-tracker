export class Cache<K, V> {
	private map = new Map<K, V>();
	private maxSize: number;

	constructor(maxSize = 1000) {
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		return this.map.get(key);
	}

	set(key: K, value: V): void {
		if (this.map.size >= this.maxSize && !this.map.has(key)) {
			const firstKey = this.map.keys().next().value;
			if (firstKey !== undefined) {
				this.map.delete(firstKey);
			}
		}
		this.map.set(key, value);
	}

	has(key: K): boolean {
		return this.map.has(key);
	}

	delete(key: K): void {
		this.map.delete(key);
	}

	clear(): void {
		this.map.clear();
	}

	invalidate(predicate: (key: K) => boolean): void {
		const keysToDelete: K[] = [];
		for (const key of this.map.keys()) {
			if (predicate(key)) {
				keysToDelete.push(key);
			}
		}
		for (const key of keysToDelete) {
			this.map.delete(key);
		}
	}
}
