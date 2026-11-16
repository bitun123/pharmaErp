"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  labelRight?: React.ReactNode;
  error?: string;
  helperText?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      id: customId,
      name,
      label,
      labelRight,
      error,
      helperText,
      leftIcon,
      rightIcon,
      type = "text",
      required,
      disabled,
      className,
      containerClassName,
      inputClassName,
      ...props
    },
    ref
  ) => {
    // Generate a stable ID if none provided
    const reactId = React.useId();
    const id = customId || name || reactId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    // Password visibility toggle logic
    const isPasswordType = type === "password";
    const [showPassword, setShowPassword] = React.useState(false);
    const resolvedType = isPasswordType ? (showPassword ? "text" : "password") : type;

    return (
      <div className={cn("space-y-1.5 w-full", containerClassName)}>
        {/* Label & Label-Right Action Row */}
        {(label || labelRight) && (
          <div className="flex items-center justify-between text-sm font-medium">
            {label && (
              <label htmlFor={id} className="text-foreground flex items-center gap-1">
                <span>{label}</span>
                {required && <span className="text-destructive font-bold" aria-hidden="true">*</span>}
              </label>
            )}
            {labelRight && <div className="text-muted-foreground">{labelRight}</div>}
          </div>
        )}

        {/* Input Wrapper with Icons */}
        <div className="relative flex items-center">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none size-4">
              {leftIcon}
            </div>
          )}

          {/* Core Input Element */}
          <Input
            ref={ref}
            id={id}
            name={name}
            type={resolvedType}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full h-11 text-base sm:text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all outline-none",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon || isPasswordType ? "pr-10" : "pr-3.5",
              error
                ? "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20"
                : "border-input hover:border-outline focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
              disabled && "opacity-50 cursor-not-allowed bg-muted/40",
              inputClassName,
              className
            )}
            {...props}
          />

          {/* Password Toggle Button */}
          {isPasswordType && !rightIcon && (
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer rounded-md"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}

          {/* Custom Right Icon / Action */}
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Feedback */}
        {error ? (
          <p id={errorId} role="alert" className="text-[11px] text-destructive flex items-center gap-1 font-medium mt-1 animate-in fade-in">
            <AlertCircle className="size-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-muted-foreground mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
