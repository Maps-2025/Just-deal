interface FieldProps {
  label: string;
  value?: string | number | null | undefined;
}

export function Field({ label, value }: FieldProps) {
  const display = value != null && value !== "" ? String(value) : "N/A";
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm mt-0.5">{display}</p>
    </div>
  );
}
