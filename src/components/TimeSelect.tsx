import React from 'react';

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

export function TimeSelect({ value, onChange, className = '' }: TimeSelectProps) {
  // Génère les options pour chaque heure de la journée
  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return {
      value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    };
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {timeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}