import { useState } from "react";

interface ProductDescriptionProps {
  description?: string;
  videoUrl?: string;
}

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export const ProductDescription = ({ description, videoUrl }: ProductDescriptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="box-border caret-transparent">
      <div className="relative text-[15px] box-border caret-transparent break-words w-full md:text-base md:break-all">
        <div
          className="relative text-[15px] box-border caret-transparent break-words overflow-hidden md:text-base md:break-all"
          style={!expanded ? { maxHeight: '600px' } : undefined}
        >
          <div className="text-[15px] box-border caret-transparent break-words md:text-base md:break-all">
            {embedUrl && (
              <div className="text-[15px] box-border caret-transparent break-words md:text-[18.72px] md:break-all">
                <div className="text-[15px] box-border caret-transparent break-words md:text-[18.72px] md:break-all">
                  <iframe
                    src={embedUrl}
                    className="text-[15px] box-border caret-transparent inline min-h-[75px] break-words align-baseline w-full py-[15px] md:text-[18.72px] md:min-h-[300px] md:break-all"
                    allowFullScreen
                    title="Product Video"
                  />
                </div>
              </div>
            )}
            {description && (
              <div
                className="text-[15px] box-border caret-transparent break-words md:text-base md:break-all [&_img]:max-w-full [&_img]:inline [&_img]:align-baseline"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
          {!expanded && (
            <div className="absolute text-[15px] bg-[linear-gradient(rgba(0,0,0,0),rgb(255,255,255))] box-border caret-transparent h-[50px] break-words pointer-events-none w-full left-0 bottom-0 md:text-base md:break-all" />
          )}
        </div>
        <div className="text-[15px] box-border caret-transparent break-words text-center mt-2.5 md:text-base md:break-all">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-green-600 text-[15px] font-medium bg-transparent caret-transparent break-words px-[15px] py-[5px] rounded-bl rounded-br rounded-tl rounded-tr font-arial md:text-[13.3333px] md:break-all hover:bg-green-600/10"
          >
            {" "}
            {expanded ? 'See Less' : 'See More'}{" "}
          </button>
        </div>
      </div>
    </div>
  );
};
