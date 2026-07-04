interface NumberStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function NumberStepper({ value, min, max, onChange }: NumberStepperProps) {
  function clamp(v: number) {
    let result = v;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  return (
    <div className="number-stepper">
      <input
        type="number"
        className="number-stepper__input"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
      />
      <button
        type="button"
        className="number-stepper__button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={min !== undefined && value <= min}
        aria-label="Verringern"
      >
        −
      </button>
      <button
        type="button"
        className="number-stepper__button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={max !== undefined && value >= max}
        aria-label="Erhöhen"
      >
        +
      </button>
    </div>
  );
}
