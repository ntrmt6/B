interface ReviewIconProps {
    rating?: number;
}

export default function Reviwicon({ rating = 0 }: ReviewIconProps) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const totalStars = 5;

    return (
        <div className="flex items-center">
            {Array.from({ length: totalStars }).map((_, i) => {
                if (i < fullStars) {
                    return (
                        <img key={i} src={'https://details-snit.vercel.app/images/star.svg'} alt="star" width={16} height={16} />
                    );
                }
                if (i === fullStars && hasHalf) {
                    return (
                        <img key={i} src={'https://details-snit.vercel.app/images/halfstar.svg'} alt="half star" width={16} height={16} />
                    );
                }
                return (
                    <svg key={i} width={16} height={16} viewBox="0 0 16 16" fill="none">
                        <path d="M8 1l2.245 4.549 5.02.73-3.633 3.54.857 5.001L8 12.351 3.511 14.82l.857-5.001L.735 6.279l5.02-.73L8 1z" fill="#E5E7EB" />
                    </svg>
                );
            })}
        </div>
    )
}
