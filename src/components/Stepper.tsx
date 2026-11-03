import ui from './ui.module.css';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;   // for screen readers, e.g. "Durata del ciclo"
}

// − 28 +
export default function Stepper({ value, min, max, onChange, label }: StepperProps) {
  return (
    <div className={ui.stepper} role="group" aria-label={label}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Meno">−</button>
      <output aria-live="polite">{value}</output>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Più">+</button>
    </div>
  );
}
