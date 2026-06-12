export const CustomerReviewsSection = (): JSX.Element => {
  const review = {
    name: "John D",
    avatar: "https://c.animaapp.com/QpBFwAMQ/img/1-picture-@2x.png",
    rating: "https://c.animaapp.com/QpBFwAMQ/img/frame-730.svg",
    text: "Fast delivery and fantastic quality! The customer support team was quick to resolve my query. Dealport has earned a loyal customer.",
  };

  return (
    <article className="flex flex-col w-[440px] h-[180px] items-start justify-center gap-[8.78px] p-[21.95px] absolute top-[3473px] left-[calc(50.00%_-_200px)] bg-[#eaf8e7] rounded-[13.17px] shadow-8dp-umbra">
      <header className="flex w-[282px] items-center gap-[8.78px] relative flex-[0_0_auto] mt-[-0.67px]">
        <div className="gap-[13.17px] flex items-center relative flex-1 grow">
          <img
            className="w-[52.67px] h-[52.67px] rounded-[13.17px] bg-cover bg-[50%_50%]"
            src={review.avatar}
            alt={`${review.name} profile picture`}
          />

          <h3 className="relative w-fit mr-[-0.29px] [font-family:'Lato',Helvetica] font-bold text-[#023337] text-[24.1px] tracking-[0] leading-[normal]">
            {review.name}
          </h3>
        </div>

        <div className="inline-flex items-center gap-[8.78px] relative flex-[0_0_auto]">
          <img
            className="relative flex-[0_0_auto]"
            alt="5 star rating"
            src={review.rating}
          />
        </div>
      </header>

      <blockquote className="relative self-stretch [font-family:'Lato',Helvetica] font-normal text-black text-[17.6px] tracking-[0] leading-[25.2px]">
        &quot;{review.text}&quot;
      </blockquote>
    </article>
  );
};
