import React from 'react';

interface BlurryBackgroundProps {
    color1?: string;
    color2?: string;
    speed?: number;
    children: React.ReactNode;
}

export default function BlurryBackground({
    color1,
    color2,
    speed = 12,
    children
}: BlurryBackgroundProps) {
    return (
        <div className="relative w-full max-w-[100vw]">
            <div className="absolute inset-0 z-[-1] pointer-events-none">
                <div
                    className="absolute rounded-full filter blur-3xl opacity-60 w-4/5 h-1/2 top-[0%] left-[10%] animate-scale-in-out"
                    style={{
                        backgroundColor: color2,
                        animationDuration: `${speed}s`,
                        animationIterationCount: 'infinite'
                    }}
                ></div>

                <div
                    className="absolute rounded-full filter blur-[90px] opacity-60 w-4/5 h-[40%] bottom-[0%] right-[10%] animate-scale-in-out"
                    style={{
                        backgroundColor: color1,
                        animationDuration: `${speed}s`,
                        animationDelay: `${speed / 2}s`,
                        animationIterationCount: 'infinite'
                    }}
                ></div>
            </div>

            <div className="relative">
                {children}
            </div>
        </div>
    );
};