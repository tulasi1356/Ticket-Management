import { Controller } from "react-hook-form";
import { Input } from "../ui/input";

type Props = {
  name: string;
  control: any;
  label: string;
  placeholder?: string;
  size?: "xs" | "sm" | "md" | "lg";
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

export function FormInput({
  name,
  control,
  label,
  placeholder,
  size = "md",
  ...props
}: Props) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">{label}</label>

          <Input
            {...field}
            placeholder={placeholder}
            size={size} 
            {...props}
          />

          {fieldState.error && (
            <p className="text-red-500 text-xs">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}