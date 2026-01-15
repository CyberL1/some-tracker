class EffectAlgorithms {
	static initSlide(parameter, delay) {
		const normalizedDelay = delay || 1;
		const effectiveDelay = normalizedDelay === 0 ? 1 : normalizedDelay;
		return {
			step: parameter,
			delay: effectiveDelay,
			counter: effectiveDelay,
			current: parameter
		};
	}

	static processSlideCounter(counter, delay, step, current, alreadyApplied) {
		if (counter > 0) {
			const newCounter = counter - 1;
			if (newCounter === 0) {
				const newCurrent = alreadyApplied ? current : current + step;
				return {
					counter: delay,
					current: newCurrent,
					applied: false
				};
			}
			return {
				counter: newCounter,
				current,
				applied: alreadyApplied
			};
		}
		return { counter, current, applied: alreadyApplied };
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
}

export default EffectAlgorithms;
