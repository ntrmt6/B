export const CallToActionSection = (): JSX.Element => {
  const testimonial = {
    author: {
      name: "Priya R",
      avatar: "https://c.animaapp.com/QpBFwAMQ/img/18-picture-@2x.png",
    },
    rating: {
      icon: "https://c.animaapp.com/QpBFwAMQ/img/frame-730-5.svg",
      alt: "5 star rating",
    },
    quote:
      "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
  };

  return (
    <article className="flex flex-col w-[401px] items-start justify-center gap-2 p-5 absolute top-[3688px] left-[calc(50.00%_-_340px)] bg-white rounded-xl border border-solid border-primary-neutal-200">
      <header className="flex w-[257px] items-center gap-2 relative flex-[0_0_auto]">
        <div className="gap-3 flex items-center relative flex-1 grow">
          <img
            className="w-12 h-12 rounded-xl relative object-cover"
            alt={`${testimonial.author.name} profile picture`}
            src={testimonial.author.avatar}
          />

          <h3 className="relative w-fit mr-[-1.00px] [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[22px] tracking-[0] leading-[normal] whitespace-nowrap">
            {testimonial.author.name}
          </h3>
        </div>

        <div
          className="inline-flex items-center gap-2 relative flex-[0_0_auto]"
          role="img"
          aria-label={testimonial.rating.alt}
        >
          <img
            className="relative flex-[0_0_auto]"
            alt={testimonial.rating.alt}
            src={testimonial.rating.icon}
          />
        </div>
      </header>

      <blockquote className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-base tracking-[0] leading-[23px]">
        &quot;{testimonial.quote}&quot;
      </blockquote>
    </article>
  );
};
