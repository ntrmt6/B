interface CallOrderBarProps {
    phoneNumber?: string;
    onShare?: () => void;
}

const CallOrderBar = ({ phoneNumber, onShare }: CallOrderBarProps) => {
    if (!phoneNumber) return null;

    return (
        <div className="w-full flex gap-2 items-center justify-between pt-1 hidden lg:flex">
            <a href={`tel:${phoneNumber}`} className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg py-2.5 w-full justify-center transition-colors">
                <div className="text-blue-500">
                    <img
                        src={'https://details-snit.vercel.app/images/call.svg'}
                        alt='call'
                        width={16}
                        height={16}
                    />
                </div>
                <p
                    className="text-sm font-semibold"
                    style={{
                        background: "linear-gradient(90deg, #38BDF8 0%, #1E90FF 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Call Order : {phoneNumber}
                </p>
            </a>
            <button onClick={onShare} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors active:scale-95">
                <img
                    src='https://details-snit.vercel.app/images/share-01.svg'
                    alt="share"
                    width={20}
                    height={20}
                />
            </button>
        </div>
    );
};

export default CallOrderBar;
