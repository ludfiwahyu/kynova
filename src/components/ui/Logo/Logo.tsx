import type { LogoProps } from '@/components/ui/Logo/types'

export function Logo({ size = 24 }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            aria-hidden="true"
        >
            <rect
                width="32"
                height="32"
                rx="8"
                fill="var(--accent)"
            />
            <path
                d="M21.46 9.49A8.5 8.5 0 1 0 21.46 22.51"
                fill="none"
                stroke="var(--accent-ink)"
                strokeWidth="3.75"
                strokeLinecap="round"
            />
            <circle
                cx="24.5"
                cy="16"
                r="2.9"
                fill="var(--accent-ink)"
            />
        </svg>
    )
}
