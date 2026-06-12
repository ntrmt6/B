export const HeaderGadgets = () => {
  return (
    <>
      {/* Desktop Header */}
      <div className="box-border caret-transparent hidden md:block">
        <header className="fixed bg-white border-b-stone-300 box-border caret-transparent w-full z-[999] border-b left-0 top-0">
          {/* Top Bar */}
          <div className="border-b-stone-300 box-border caret-transparent hidden h-[41px] overflow-hidden border-b md:block">
            <div className="box-border caret-transparent max-w-[1340px] w-[95%] mx-auto">
              <div className="items-center box-border caret-transparent flex justify-between py-[7px]">
                <div className="items-center box-border caret-transparent gap-x-5 flex min-h-0 min-w-0 gap-y-5 md:min-h-[auto] md:min-w-[auto]">
                  <a className="text-zinc-900 text-sm font-medium items-center box-border caret-transparent flex min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto] hover:text-zinc-900 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-zinc-900 hover:rounded-none hover:border-0 hover:border-none">
                    <img
                      src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-1.svg"
                      alt="Icon"
                      className="box-border caret-transparent block h-5 w-5 mr-[5px]"
                    />
                    <span className="box-border caret-transparent block min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                      Admin Notice:
                    </span>
                  </a>
                </div>
                <div className="box-border caret-transparent basis-[0%] grow min-h-0 min-w-0 ml-2.5 md:min-h-[auto] md:min-w-[auto]">
                  <div className="box-border caret-transparent inline-block text-nowrap w-[stretch] overflow-hidden">
                    Easy return policy and complete cash on delivery, ease of shopping!
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Main Nav */}
          <div className="box-border caret-transparent">
            <div className="box-border caret-transparent max-w-[1340px] w-[95%] mx-auto">
              <div className="items-center box-border caret-transparent gap-x-2.5 flex justify-between gap-y-2.5 w-full py-5">
                {/* Logo */}
                <a
                  href="/"
                  className="text-blue-700 items-center box-border caret-transparent flex justify-start max-w-[180px] min-h-0 min-w-0 w-full md:min-h-[auto] md:min-w-[auto] hover:text-blue-800 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none"
                >
                  <img
                    sizes="(max-width: 599px) 200px, (min-width: 600px) 400px"
                    alt="Overseas Products"
                    src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/74.webp"
                    className="aspect-[auto_5400_/_1500] box-border caret-transparent block h-full max-h-[50px] max-w-[180px] min-h-0 min-w-0 object-contain w-full md:min-h-[auto] md:min-w-[auto] hover:text-blue-700 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-blue-700 hover:rounded-none hover:border-0 hover:border-none"
                  />
                </a>
                {/* Search Bar */}
                <div className="box-border caret-transparent block max-w-[650px] min-h-0 min-w-0 w-full md:min-h-[auto] md:min-w-[auto]">
                  <div className="relative box-border caret-transparent">
                    <div className="relative items-center bg-white box-border caret-transparent flex h-10 w-full border-lime-500 rounded-bl rounded-br rounded-tl rounded-tr border-2 border-solid">
                      <form className="relative box-border caret-transparent h-full min-h-0 min-w-0 w-full md:min-h-[auto] md:min-w-[auto]">
                        <input
                          type="text"
                          placeholder=""
                          name="searchTerm"
                          className="relative text-[13.3333px] bg-transparent box-border caret-transparent h-full w-full z-[2] pl-2.5 pr-0 py-0 rounded-bl rounded-br rounded-tl rounded-tr font-arial"
                        />
                        <div className="absolute items-center box-border caret-transparent flex h-full pointer-events-none transform-none w-[calc(100%_-_60px)] z-[1] left-2.5 top-2/4 md:translate-y-[-50.0%]">
                          <div className="relative box-border caret-transparent h-full min-h-0 min-w-0 w-full overflow-hidden md:min-h-[auto] md:min-w-[auto]">
                            <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full leading-10">gadget item</span>
                            <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full leading-10">gift</span>
                            <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full leading-10">educational toy</span>
                          </div>
                        </div>
                      </form>
                      <div className="box-border caret-transparent min-h-0 min-w-0 text-center mr-1 pt-1 px-[5px] rounded-[7px] md:min-h-[auto] md:min-w-[auto] hover:text-black hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-[7px] hover:border-0 hover:border-none hover:border-black">
                        <img
                          src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-2.svg"
                          alt="Icon"
                          className="box-border caret-transparent h-6 w-6"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Cart + User */}
                <div className="items-center box-border caret-transparent gap-x-2.5 flex min-h-0 min-w-[183px] gap-y-2.5 md:min-h-[auto]">
                  {/* Cart */}
                  <div className="box-border caret-transparent block min-h-0 min-w-0 md:min-h-[auto] md:min-w-[auto]">
                    <div className="relative box-border caret-transparent text-center pt-[5px] pb-px px-2.5 rounded-[5px]">
                      <div className="box-border caret-transparent">
                        <img
                          src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-3.svg"
                          alt="Icon"
                          className="box-border caret-transparent w-6"
                        />
                        <span className="absolute text-white text-xs font-medium bg-lime-500 box-border caret-transparent block h-5 leading-5 top-[-3px] w-5 rounded-[100%] -right-px">0</span>
                      </div>
                    </div>
                  </div>
                  {/* User */}
                  <div className="text-zinc-900 items-center bg-white box-border caret-transparent gap-x-[5px] flex min-h-0 min-w-0 gap-y-[5px] px-2.5 py-[5px] rounded-[20px] md:min-h-[auto] md:min-w-[auto] hover:text-zinc-900 hover:bg-neutral-100 hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:border-zinc-900 hover:rounded-[20px] hover:border-0 hover:border-none">
                    <a className="box-border caret-transparent block min-h-0 min-w-0 pt-[7px] md:min-h-[auto] md:min-w-[auto]">
                      <img
                        src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-5.svg"
                        alt="Icon"
                        className="box-border caret-transparent w-[22px]"
                      />
                    </a>
                    <h3 className="text-xs font-bold box-border caret-transparent min-h-0 min-w-0 text-nowrap md:min-h-[auto] md:min-w-[auto]">
                      <a href="/login" className="text-black box-border caret-transparent text-nowrap pt-[7px] hover:text-neutral-900 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">Login</a>
                      {" "}/ {" "}
                      <a href="/signup" className="text-black box-border caret-transparent text-nowrap pt-[7px] hover:text-neutral-900 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline hover:decoration-solid hover:decoration-auto hover:rounded-none hover:border-0 hover:border-none hover:border-black">SignUp</a>
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="box-border caret-transparent inline-block h-[117px]"></div>
      </div>

      {/* Mobile Header */}
      <div className="box-border caret-transparent block md:hidden">
        <header className="fixed bg-white border-b-stone-300 box-border caret-transparent w-full z-[999] overflow-hidden border-b left-0 top-0">
          <div className="box-border caret-transparent max-w-[1340px] w-[93%] mx-auto">
            {/* Mobile Top Bar */}
            <div className="box-border caret-transparent">
              <div className="items-center box-border caret-transparent flex leading-[18px] pt-2 pb-[5px]">
                <div className="box-border caret-transparent min-h-[auto] min-w-[auto]">
                  <a className="box-border caret-transparent">
                    <img
                      src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-6.svg"
                      alt="Icon"
                      className="box-border caret-transparent h-5 w-5"
                    />
                  </a>
                </div>
                <div className="box-border caret-transparent basis-[0%] grow min-h-[auto] min-w-[auto] ml-[5px]">
                  <div className="box-border caret-transparent inline-block text-nowrap w-[stretch] overflow-hidden">
                    Easy return policy and complete cash on delivery, ease of shopping!
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile Logo */}
            <a
              href="/"
              className="text-blue-700 items-center box-border caret-transparent flex h-[52px] justify-center text-center w-full overflow-hidden mt-2.5 mx-auto hover:text-blue-800 hover:bg-transparent hover:shadow-none hover:outline-offset-0 hover:outline-0 hover:no-underline"
            >
              <img
                sizes="(max-width: 599px) 200px, (min-width: 600px) 400px"
                alt="Overseas Products"
                src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/74.webp"
                className="aspect-[auto_5400_/_1500] box-border caret-transparent block max-h-[50px] max-w-[140px] min-h-[auto] min-w-[auto] object-contain w-full"
              />
            </a>
            {/* Mobile Search */}
            <div className="box-border caret-transparent">
              <div className="items-center box-border caret-transparent flex w-full py-2.5">
                <ul className="box-border caret-transparent flex-col min-h-[auto] min-w-[auto] pl-0 pr-[5px]">
                  <li className="bg-lime-500 box-border caret-transparent block h-0.5 w-[22px] mx-auto my-[5px]"></li>
                  <li className="bg-lime-500 box-border caret-transparent block h-0.5 w-[22px] mx-auto my-[5px]"></li>
                  <li className="bg-lime-500 box-border caret-transparent block h-0.5 w-[22px] mx-auto my-[5px]"></li>
                </ul>
                <div className="items-center box-border caret-transparent flex h-10 justify-between min-h-[auto] min-w-[auto] w-[95%] border border-lime-500 rounded-[5px] border-solid">
                  <div className="box-border caret-transparent flex justify-center min-h-[auto] min-w-[auto]">
                    <div className="text-lime-500 box-border caret-transparent min-h-[auto] min-w-[auto] ml-1 pt-[3px] px-[5px]">
                      <img
                        src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-7.svg"
                        alt="Icon"
                        className="box-border caret-transparent h-6 w-6"
                      />
                    </div>
                    <div className="caret-transparent flex h-[25px] justify-center min-h-[auto] min-w-[auto] w-full pt-[5px] pb-0.5">
                      <div className="box-border caret-transparent min-h-[auto] min-w-[auto] overflow-hidden">
                        <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full pl-2.5">gadget item</span>
                        <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full pl-2.5">gift</span>
                        <span className="text-neutral-400 text-[15px] font-medium box-border caret-transparent block h-full pl-2.5">educational toy</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium bg-lime-500 box-border caret-transparent min-h-[auto] min-w-[auto] mr-1 px-2.5 py-1.5 rounded-[5px]">Search</p>
                </div>
                <a
                  href="/cart"
                  className="relative text-blue-700 box-border caret-transparent block min-h-[auto] min-w-[auto] text-center pt-[5px] pb-px px-2.5 rounded-[10px]"
                >
                  <img
                    src="https://c.animaapp.com/mmu22iaoUL3nbW/assets/icon-8.svg"
                    alt="Icon"
                    className="box-border caret-transparent h-6 w-6"
                  />
                  <span className="absolute text-white text-xs font-medium bg-lime-500 box-border caret-transparent block h-5 leading-5 top-[-3px] w-5 rounded-[100%] -right-px">0</span>
                </a>
              </div>
            </div>
          </div>
        </header>
        <div className="box-border caret-transparent inline-block h-[150px]"></div>
        {/* Side Nav */}
        <div className="box-border caret-transparent">
          <div className="box-border caret-transparent">
            <div className="fixed bg-white box-border caret-transparent h-[1000px] max-w-[80%] w-full z-[1000] -left-full top-0">
              <div className="relative items-center box-border caret-transparent flex justify-start px-[18px] py-[13px]">
                <h3 className="text-lime-500 text-xl font-medium items-center box-border caret-transparent gap-x-2.5 flex justify-start leading-[26px] min-h-[auto] min-w-[auto] gap-y-2.5">Categories</h3>
                <span className="absolute text-[15px] items-center bg-lime-500 shadow-[rgba(0,0,0,0.03)_0px_2px_3px_0px] box-border caret-transparent flex h-[27px] justify-center w-[27px] rounded-[50%] -right-2.5 top-2">
                  <div role="img" className="text-white text-lg items-center bg-no-repeat box-border caret-transparent flex fill-white h-6 justify-center leading-[18px] min-h-[auto] min-w-[auto] text-nowrap w-6 overflow-hidden font-material_icons">close</div>
                </span>
              </div>
              <div className="box-border caret-transparent h-[870px] overflow-x-auto overflow-y-scroll w-full">
                <ul className="box-border caret-transparent list-none pl-0"></ul>
              </div>
              <div className="box-border caret-transparent mt-2.5">
                <p className="text-[15px] items-center box-border caret-transparent gap-x-[5px] flex justify-center gap-y-[5px] text-center w-full px-2.5 py-[13px]">
                  All Rights Reserved by{" "}
                  <a href="/" className="text-lime-500 box-border caret-transparent block min-h-[auto] min-w-[auto] underline">Overseas Products</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default HeaderGadgets;