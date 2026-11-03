import { useState } from 'react';
import ui from './ui.module.css';

interface ChipPickerProps {
  options: string[];                  // all the choices
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddOption?: (name: string) => void;   // if given, shows "+ Aggiungi"
  addLabel?: string;
}

// Text chips with multiple choice, and an optional field to add a new choice
export default function ChipPicker({ options, selected, onChange, onAddOption, addLabel = 'Aggiungi' }: ChipPickerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);
  }

  function add() {
    const clean = name.trim();
    if (clean) {
      if (!options.includes(clean)) onAddOption?.(clean);
      if (!selected.includes(clean)) onChange([...selected, clean]);
    }
    setName('');
    setAdding(false);
  }

  return (
    <div className={ui.chips}>
      {options.map((option) => (
        <button key={option} className={ui.chip} aria-pressed={selected.includes(option)} onClick={() => toggle(option)}>
          {option}
        </button>
      ))}

      {onAddOption && !adding && (
        <button className={ui.chipAdd} onClick={() => setAdding(true)}>
          + {addLabel}
        </button>
      )}

      {adding && (
        <form
          style={{ display: 'flex', gap: 8, width: '100%' }}
          onSubmit={(e) => {
            e.preventDefault();   // a form would reload the page: we handle it ourselves
            add();
          }}
        >
          <input
            className={ui.input}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={add}
            placeholder="Es. Ibuprofene 400"
          />
        </form>
      )}
    </div>
  );
}
