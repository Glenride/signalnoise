import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Signal/radar icon */}
            <path
                d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"
                fill="currentColor"
            />
            <path
                d="M8.46 8.46a4.5 4.5 0 0 0 0 7.08"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M15.54 8.46a4.5 4.5 0 0 1 0 7.08"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M5.63 5.63a9 9 0 0 0 0 12.74"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M18.37 5.63a9 9 0 0 1 0 12.74"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}
