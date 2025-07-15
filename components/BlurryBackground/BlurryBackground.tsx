import React from 'react';

interface BlurryBackgroundProps {
    color1?: string;
    speed?: number;
    children: React.ReactNode;
}

const blobClasses = `absolute rounded-full mix-blend-multiply filter blur-3xl opacity-70`;
const animationClasses = `animate-[scale-in-out]`;

export default function BlurryBackground({
    color1,
    speed,
    children
}: BlurryBackgroundProps) {
    return (
        <div className="relative w-full h-full overflow-hidden -z-10 ">
            <div className="absolute rotate-1 inset-0 ">
                <div
                    className={`${blobClasses} w-4/5 h-[52%] top-[24%] left-[10%] ${animationClasses}`}
                    style={{
                        backgroundColor: color1,
                        animationDuration: `${speed}s`,
                        animationIterationCount: 'infinite'
                    }}
                ></div>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};