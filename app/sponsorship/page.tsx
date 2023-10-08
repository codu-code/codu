import type { NextPage } from "next";

const Sponsorship = () => {
  return (
    <div className="">
      <main className="bg-white lg:bg-transparent relative">
        <div className="relative pt-12 pb-16 px-4 sm:pt-16 sm:px-6 lg:px-8 lg:max-w-7xl lg:mx-auto lg:grid lg:grid-cols-2 ">
          <div className="lg:pl-8">
            <div className="text-base max-w-prose mx-auto lg:max-w-lg lg:ml-0 lg:mr-16">
              <h2 className="text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
                Support us
              </h2>
              <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-black sm:text-6xl pb-8 border-b-2">
                Sponsor Codú
              </h3>
              <p className="mt-8 text-lg text-neutral-500">
                Our work and events would not be possible without the support of
                our partners.
              </p>
              <p className="mt-3 text-lg text-neutral-500">
                {`Codú is the perfect place to show your company's support of open source software, find new developers and fund the next generation of avid learners.`}
              </p>
              <p className="mt-3 text-lg text-neutral-500">
                {`Sponsors can post jobs to our network of thousands of developers (and growing), brand at our events, and advertise in our newsletter.`}
              </p>
              <p className="mt-3 text-lg text-neutral-500"></p>
              <div className="relative">
                <p className="text-black mt-8 text-lg font-semibold">
                  For more info contact us:
                </p>
                <a
                  href="mailto:partnerships@codu.co"
                  className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 text-2xl font-bold"
                >
                  partnerships@codu.co
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-0 -z-10 bg-white">
          <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-black">
            <img
              className="h-56 w-full object-cover lg:absolute lg:h-full"
              src="/images/workshops/workshop-class.jpeg"
              alt="Developers working on their laptops at a table"
            />
          </div>
        </div>
      </main>
      <div className="bg-gradient-to-r from-orange-400 to-pink-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white">
            Previous sponsors include
          </h2>
          <div className="flow-root mt-8 lg:mt-10">
            <div className="-mt-4 -ml-8 flex flex-wrap justify-between lg:-ml-4">
              <div className="mt-4 ml-8 flex flex-grow flex-shrink-0 lg:flex-grow-0 lg:ml-4">
                <img
                  className="h-16 my-auto"
                  src="/images/sponsors/harveynash.png"
                  alt="StaticKit"
                />
              </div>
              <div className="mt-4 ml-8 flex flex-grow flex-shrink-0 lg:flex-grow-0 lg:ml-4">
                <img
                  className="h-16 my-auto"
                  src="/images/sponsors/version1.png"
                  alt="Version 1"
                />
              </div>
              <div className="mt-4 ml-8 flex flex-grow flex-shrink-0 lg:flex-grow-0 lg:ml-4">
                <img
                  className="h-12 my-auto"
                  src="/images/sponsors/offerzen.png"
                  alt="Mirage"
                />
              </div>

              <div className="mt-4 ml-8 flex flex-grow flex-shrink-0 lg:flex-grow-0 lg:ml-4">
                <img
                  className="h-12 my-auto"
                  src="/images/sponsors/learnupon.png"
                  alt="Transistor"
                />
              </div>
              <div className="mt-4 ml-8 flex flex-grow flex-shrink-0 lg:flex-grow-0 lg:ml-4">
                <img
                  className="h-12 my-auto"
                  src="/images/sponsors/wework.png"
                  alt="Workcation"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sponsorship;
