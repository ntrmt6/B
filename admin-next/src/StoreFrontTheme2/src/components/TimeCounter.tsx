export type TimeCounterProps = {
  hours: string;
  mins: string;
  sec: string;
};

export const TimeCounter = (props: TimeCounterProps) => {
  return (
    <div className="relative items-center bg-transparent box-border caret-transparent gap-x-[7px] flex justify-center max-w-[430px] gap-y-[7px] text-center w-auto z-[2] mx-auto md:bg-white md:w-full">
      <div className="items-center box-border caret-transparent flex flex-col h-[34px] justify-center min-h-[auto] min-w-[auto] w-10 border-violet-700 rounded-[5px] border-2 border-solid">
        <div className="text-violet-700 text-xs font-bold box-border caret-transparent leading-3 min-h-[auto] min-w-[auto]">
          {props.hours}
        </div>
        <div className="text-violet-700 text-[11px] font-medium box-border caret-transparent brightness-[1.2] leading-3 min-h-[auto] min-w-[auto]">
          Hours
        </div>
      </div>
      <div className="items-center box-border caret-transparent flex flex-col h-[34px] justify-center min-h-[auto] min-w-[auto] w-10 border-violet-700 rounded-[5px] border-2 border-solid">
        <div className="text-violet-700 text-xs font-bold box-border caret-transparent leading-3 min-h-[auto] min-w-[auto]">
          {props.mins}
        </div>
        <div className="text-violet-700 text-[11px] font-medium box-border caret-transparent brightness-[1.2] leading-3 min-h-[auto] min-w-[auto]">
          Mins
        </div>
      </div>
      <div className="items-center box-border caret-transparent flex flex-col h-[34px] justify-center min-h-[auto] min-w-[auto] w-10 border-violet-700 rounded-[5px] border-2 border-solid">
        <div className="text-violet-700 text-xs font-bold box-border caret-transparent leading-3 min-h-[auto] min-w-[auto]">
          {props.sec}
        </div>
        <div className="text-violet-700 text-[11px] font-medium box-border caret-transparent brightness-[1.2] leading-3 min-h-[auto] min-w-[auto]">
          Sec
        </div>
      </div>
    </div>
  );
};
