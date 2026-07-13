import { useState } from 'react';
import Picker from 'react-mobile-picker';
import './WheelPickerModal.css';

export interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  options: PickerOption[];
  value: string;
  onChange: (val: string) => void;
  title: string;
}

export function WheelPickerModal({ isOpen, onClose, options, value, onChange, title }: Props) {
  const [pickerValue, setPickerValue] = useState({ selected: value });
  const [prevValue, setPrevValue] = useState(value);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (value !== prevValue || (isOpen && !prevIsOpen)) {
    setPrevValue(value);
    setPrevIsOpen(isOpen);
    setPickerValue({ selected: value });
  } else if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
  }

  if (!isOpen) return null;

  const handlePickerChange = (newValue: any) => {
    setPickerValue(newValue);
  };

  const handleDone = () => {
    onChange(pickerValue.selected);
    onClose();
  };

  return (
    <div className="wheel-modal-overlay" onClick={onClose}>
      <div className="wheel-modal-content" onClick={e => e.stopPropagation()}>
        <div className="wheel-modal-header">
          <button className="wheel-modal-cancel" onClick={onClose}>Cancel</button>
          <span className="wheel-modal-title">{title}</span>
          <button className="wheel-modal-done" onClick={handleDone}>Done</button>
        </div>
        <div className="wheel-picker-wrapper">
          <Picker value={pickerValue} onChange={handlePickerChange} wheelMode="normal" height={180} itemHeight={40}>
            <Picker.Column name="selected">
              {options.map(opt => (
                <Picker.Item key={opt.value} value={opt.value}>
                  {({ selected }: { selected: boolean }) => (
                    <div className={`picker-item ${selected ? 'selected' : ''}`}>
                      {opt.label}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>
      </div>
    </div>
  );
}
