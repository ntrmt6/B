import { JSX } from "react";

// Stat card data for the main analytics tiles
const topRowStats = [
  {
    value: "4",
    label: "Products on Hands",
    icon: "https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428.svg",
  },
  {
    value: "65",
    label: "Total Orders",
    icon: "https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-4.svg",
  },
];

const bottomRowStats = [
  {
    value: "35",
    label: "Reserved Price",
    icon: "https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-2.svg",
  },
  {
    value: "45",
    label: "Low Stock",
    icon: "https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-1.svg",
  },
  {
    value: "452",
    label: "To be Reviewed",
    icon: "https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-3.svg",
  },
];

// Pagination dots for the notification card
const paginationDots = [
  { active: false },
  { active: true },
  { active: false },
  { active: false },
  { active: false },
];

export const Frame = (): JSX.Element => {
  return (
    <div
      className="relative w-[1146px] h-60 bg-white rounded-lg overflow-hidden"
      data-model-id="627:11224"
    >
      {/* Title */}
      <div className="absolute top-6 left-6 [font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
        Order Analytics
      </div>

      {/* Top row: Products on Hands */}
      <div className="absolute top-[calc(50.00%_-_56px)] left-6 w-[262px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_+_8px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
          Products on Hands
        </div>
        <div className="absolute top-[calc(50.00%_-_28px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
          4
        </div>
        <img
          className="absolute top-[calc(50.00%_-_22px)] left-[206px] w-11 h-11"
          alt="Frame"
          src="https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428.svg"
        />
      </div>

      {/* Top row: Total Orders */}
      <div className="absolute top-[calc(50.00%_-_56px)] left-[303px] w-[262px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_+_8px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
          Total Orders
        </div>
        <div className="absolute top-[calc(50.00%_-_28px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
          65
        </div>
        <img
          className="absolute top-[calc(50.00%_-_22px)] left-[206px] w-11 h-11"
          alt="Frame"
          src="https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-4.svg"
        />
      </div>

      {/* Bottom row: Reserved Price */}
      <div className="absolute top-[calc(50.00%_+_28px)] left-6 w-[262px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_+_8px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
          Reserved Price
        </div>
        <div className="absolute top-[calc(50.00%_-_28px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
          35
        </div>
        <img
          className="absolute top-[calc(50.00%_-_22px)] left-[206px] w-11 h-11"
          alt="Frame"
          src="https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-2.svg"
        />
      </div>

      {/* Bottom row: Low Stock */}
      <div className="absolute top-[calc(50.00%_+_28px)] left-[303px] w-[262px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_+_8px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
          Low Stock
        </div>
        <div className="absolute top-[calc(50.00%_-_28px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
          45
        </div>
        <img
          className="absolute top-[calc(50.00%_-_22px)] left-[206px] w-11 h-11"
          alt="Frame"
          src="https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-1.svg"
        />
      </div>

      {/* Language toggle widget */}
      <div className="absolute top-[calc(50.00%_-_56px)] left-[582px] w-[122px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_-_24px)] left-4 [font-family:'Poppins',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal]">
          Language
        </div>
        <div className="absolute top-8 left-4 w-[92px] h-[26px] rounded-3xl overflow-hidden border border-solid border-white">
          <div className="absolute top-1 left-1 w-[43px] h-[18px] flex items-center justify-center bg-white rounded-[20px] overflow-hidden">
            <div className="flex items-center h-2 ml-px w-[22px] [font-family:'Poppins',Helvetica] font-normal text-black text-xs tracking-[0] leading-[111.2px] whitespace-nowrap">
              Eng
            </div>
          </div>
          <div className="absolute top-[calc(50.00%_-_4px)] left-[calc(50.00%_+_8px)] h-2 flex items-center [font-family:'Poppins',Helvetica] font-normal text-black text-xs tracking-[0] leading-[111.2px] whitespace-nowrap">
            বল
          </div>
        </div>
      </div>

      {/* Date/Day widget */}
      <div className="top-[calc(50.00%_-_56px)] left-[722px] w-[122px] h-[68px] bg-[#f8f8f8] absolute rounded-lg overflow-hidden">
        <div className="absolute top-[22px] left-[26px] w-40 h-40 rounded-[80px] bg-[linear-gradient(90deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)]" />
        <div className="absolute top-[calc(50.00%_-_24px)] left-2.5 [font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]">
          01/01
        </div>
        <div className="absolute top-[50.00%] left-[68px] [font-family:'Poppins',Helvetica] font-medium text-white text-2xl tracking-[0] leading-[normal]">
          Thu
        </div>
      </div>

      {/* Bottom row: To be Reviewed */}
      <div className="absolute top-[calc(50.00%_+_28px)] left-[582px] w-[262px] h-[68px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_+_8px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-xs tracking-[0] leading-[normal]">
          To be Reviewed
        </div>
        <div className="absolute top-[calc(50.00%_-_28px)] left-4 [font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
          452
        </div>
        <img
          className="absolute top-[calc(50.00%_-_22px)] left-[206px] w-11 h-11"
          alt="Frame"
          src="https://c.animaapp.com/mmm74fi3JtqOMO/img/frame-4428-3.svg"
        />
      </div>

      {/* Important Notification card */}
      <div className="absolute top-[calc(50.00%_-_56px)] left-[860px] w-[262px] h-[152px] bg-[#f8f8f8] rounded-lg overflow-hidden">
        <div className="absolute top-[calc(50.00%_-_68px)] left-4 [font-family:'Poppins',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal]">
          Important Notification
        </div>
        <div className="top-[calc(50.00%_-_42px)] left-4 w-[230px] h-[91px] flex items-center bg-white absolute rounded-lg overflow-hidden">
          <img
            className="mt-[7px] h-[54px] w-[226px]"
            alt="Image"
            src="https://c.animaapp.com/mmm74fi3JtqOMO/img/image-331.png"
          />
        </div>
        {/* Pagination dots */}
        <div className="inline-flex items-center gap-1 absolute top-[135px] left-[calc(50.00%_-_32px)]">
          {paginationDots.map((dot, index) =>
            dot.active ? (
              <div
                key={index}
                className="relative w-4 h-2 rounded-[32px] bg-[linear-gradient(90deg,rgba(56,189,248,1)_0%,rgba(30,144,255,1)_100%)]"
              />
            ) : (
              <div key={index} className="relative w-2 h-2 bg-white rounded" />
            ),
          )}
        </div>
      </div>
    </div>
  );
};
