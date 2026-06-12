import React, { useState } from "react";
import { BellIcon, Plus } from "lucide-react";
import { ChatIcon, SearchIcon } from "../details/Icons";

type FanItem = {
    icon: React.ReactNode;
    delay: number;
    pos: { x: number; y: number };
};

interface MobileTabBarProps {
    onHomeClick?: () => void;
}

export default function MobileTabBar({ onHomeClick }: MobileTabBarProps) {
    const [open, setOpen] = useState(false);

    const items: FanItem[] = [
        { icon: <SearchIcon />, delay: 0, pos: { x: 0, y: -78 } },
        { icon: <ChatIcon />, delay: 60, pos: { x: -62, y: -50 } },
        { icon: <BellIcon />, delay: 120, pos: { x: 62, y: -50 } },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={() => setOpen(false)}
                />
            )}
            <div className="relative z-[60]">
                {items.map((item, i) => (
                    <button
                        key={i}
                        onClick={() => setOpen(false)}
                        style={{
                            position: "fixed",
                            bottom: "78px",
                            left: "50%",
                            transform: open
                                ? `translate(calc(-50% + ${item.pos.x}px), ${item.pos.y}px) scale(1)`
                                : `translate(-50%, 0px) scale(0)`,
                            transition: open
                                ? `transform 0.35s cubic-bezier(0.34,1.56,0.64,1) ${item.delay}ms, opacity 0.3s ease ${item.delay}ms`
                                : `transform 0.25s cubic-bezier(0.55,0,1,0.45) ${(2 - i) * 50}ms, opacity 0.2s ease ${(2 - i) * 50}ms`,
                            opacity: open ? 1 : 0,
                            pointerEvents: open ? "auto" : "none",
                            zIndex: 60,
                        }}
                    >
                        <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center shadow-lg text-white hover:bg-sky-400 active:scale-95 transition-transform">
                            {item.icon}
                        </div>
                    </button>
                ))}
            </div>

            <div className="relative z-50">
                <svg
                    viewBox="0 0 393 92"
                    preserveAspectRatio="none"
                    className="absolute bottom-0 left-0 w-full h-[92px] drop-shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
                >
                    <path
                        d="M0 0H98.25H138.126C143.994 0 149.565 2.57645 153.365 7.04703L169.935 26.5418C185.485 44.8358 214.071 43.7039 228.126 24.2375L239.638 8.29257C243.398 3.08493 249.43 0 255.853 0H294.75H393V68C393 81.2548 382.255 92 369 92H24C10.7452 92 0 81.2548 0 68V0Z"
                        fill="white"
                    />
                </svg>

                <div className="relative flex items-end justify-around h-[92px] pb-4 pt-1">
                    <button onClick={onHomeClick} className="flex flex-col items-center gap-1 pt-3 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 18V15" stroke="#A2A2A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10.07 2.81997L3.14002 8.36997C2.36002 8.98997 1.86002 10.3 2.03002 11.28L3.36002 19.24C3.60002 20.66 4.96002 21.81 6.40002 21.81H17.6C19.03 21.81 20.4 20.65 20.64 19.24L21.97 11.28C22.13 10.3 21.63 8.98997 20.86 8.36997L13.93 2.82997C12.86 1.96997 11.13 1.96997 10.07 2.81997Z" stroke="#A2A2A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-xs font-medium font-urbanist">Home</span>
                    </button>

                    <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-[70]">
                        <button
                            onClick={() => setOpen((v) => !v)}
                            className="w-14 h-14 rounded-full bg-[#1DA1FA] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(14,165,233,0.5)] transition-transform duration-300"
                        >
                            <span
                                className="transition-transform duration-300"
                                style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
                            >
                                <Plus />
                            </span>
                        </button>
                    </div>

                    <button className="flex flex-col items-center gap-1 pt-3 text-[#1DA1FA]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75C7.25 9.32 9.26 11.4 11.88 11.49C11.96 11.48 12.04 11.48 12.1 11.49C12.12 11.49 12.13 11.49 12.15 11.49C12.16 11.49 12.16 11.49 12.17 11.49C14.73 11.4 16.74 9.32 16.75 6.75C16.75 4.13 14.62 2 12 2Z" fill="#1DA1FA" />
                            <path d="M17.08 14.15C14.29 12.29 9.73996 12.29 6.92996 14.15C5.65996 15 4.95996 16.15 4.95996 17.38C4.95996 18.61 5.65996 19.75 6.91996 20.59C8.31996 21.53 10.16 22 12 22C13.84 22 15.68 21.53 17.08 20.59C18.34 19.74 19.04 18.6 19.04 17.36C19.03 16.13 18.34 14.99 17.08 14.15Z" fill="#1DA1FA" />
                        </svg>
                        <span className="text-xs font-medium font-urbanist">Profile</span>
                    </button>
                </div>

                <div className="h-3 bg-white" />
            </div>
        </div>
    );
}
