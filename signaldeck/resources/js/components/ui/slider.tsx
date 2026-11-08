import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: number[]
    onValueChange?: (value: number[]) => void
    min?: number
    max?: number
    step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onValueChange) {
                onValueChange([parseFloat(e.target.value)])
            }
        }

        const val = value ? value[0] : 0

        return (
            <input
                type="range"
                ref={ref}
                className={cn(
                    "w-full cursor-pointer accent-primary bg-transparent",
                    className
                )}
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={handleChange}
                {...props}
            />
        )
    }
)
Slider.displayName = "Slider"

export { Slider }
