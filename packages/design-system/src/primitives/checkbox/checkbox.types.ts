export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  /** Render a "—" mark instead of a check; used for "all/nothing" toggles. */
  indeterminate?: boolean;
  className?: string;
}

export interface CheckboxGroupOption {
  value: string;
  label: string;
  description?: string;
}

export interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  className?: string;
}
