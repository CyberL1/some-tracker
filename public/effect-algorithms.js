class EffectAlgorithms {
	static initSlide(parameter, delay) {
		// VT2: if delay is 0 initial counter is 1, but delay stays 0 (effect applied only for first tick)
		const storedDelay = delay || 0;
		const initialCounter = storedDelay === 0 ? 1 : storedDelay;
		return {
			step: parameter,
			delay: storedDelay,
			counter: initialCounter,
			current: parameter
		};
	}

	static processSlideCounter(counter, delay, step, current) {
		if (counter > 0) {
			const newCounter = counter - 1;
			if (newCounter === 0) {
				return {
					counter: delay,
					current: current + step
				};
			}
			return {
				counter: newCounter,
				current
			};
		}
		return { counter, current };
	}

	static initPortamento(currentValue, targetValue, parameter, delay) {
		const delta = targetValue - currentValue;
		let step = parameter;
		if (delta < 0) {
			step = -parameter;
		}

		const normalizedDelay = delay || 1;
		const effectiveDelay = normalizedDelay === 0 ? 1 : normalizedDelay;

		return {
			target: targetValue,
			delta,
			step,
			delay: effectiveDelay,
			counter: effectiveDelay,
			active: true,
			currentSliding: 0
		};
	}

	static processPortamentoCounter(
		counter,
		delay,
		step,
		currentSliding,
		delta,
		target,
		baseValue
	) {
		if (counter > 0) {
			const newCounter = counter - 1;
			if (newCounter === 0) {
				if ((step >= 0 && currentSliding >= delta) || (step < 0 && currentSliding <= delta)) {
					return {
						counter: 0,
						currentSliding: 0,
						baseValue: target,
						active: false
					};
				}
				return {
					counter: delay,
					currentSliding: currentSliding + step,
					baseValue,
					active: true
				};
			}
			return {
				counter: newCounter,
				currentSliding,
				baseValue,
				active: true
			};
		}
		return {
			counter,
			currentSliding,
			baseValue,
			active: true
		};
	}

	static initOnOff(parameter) {
		const offDuration = parameter & 15;
		const onDuration = parameter >> 4;
		return {
			onDuration,
			offDuration,
			counter: onDuration,
			enabled: true
		};
	}

	static processOnOffCounter(counter, onDuration, offDuration, enabled) {
		if (counter > 0) {
			const newCounter = counter - 1;
			if (newCounter === 0) {
				const newEnabled = !enabled;
				return {
					counter: newEnabled ? onDuration : offDuration,
					enabled: newEnabled
				};
			}
			return {
				counter: newCounter,
				enabled
			};
		}
		return { counter, enabled };
	}

	static initArpeggio(parameter, delay) {
		const semitone1 = (parameter >> 4) & 15;
		const semitone2 = parameter & 15;
		const normalizedDelay = delay || 1;
		const effectiveDelay = normalizedDelay === 0 ? 1 : normalizedDelay;
		return {
			semitone1,
			semitone2,
			delay: effectiveDelay,
			counter: effectiveDelay,
			position: 0
		};
	}

	static processArpeggioCounter(counter, delay, position) {
		if (counter > 0) {
			const newCounter = counter - 1;
			if (newCounter === 0) {
				const newPosition = (position + 1) % 3;
				return {
					counter: delay,
					position: newPosition
				};
			}
			return {
				counter: newCounter,
				position
			};
		}
		return { counter, position };
	}

	static getArpeggioOffset(position, semitone1, semitone2) {
		if (position === 1) return semitone1;
		if (position === 2) return semitone2;
		return 0;
	}
}

export default EffectAlgorithms;
