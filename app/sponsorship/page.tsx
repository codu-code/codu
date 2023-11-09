// @TODO metadata

const Sponsorship = () => {
  return (
    <div className="">
      <main className="relative bg-white lg:bg-transparent">
        <div className="relative px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-2 lg:px-8 ">
          <div className="lg:pl-8">
            <div className="mx-auto max-w-prose text-base lg:ml-0 lg:mr-16 lg:max-w-lg">
              <h2 className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-xl font-semibold uppercase leading-6 tracking-wide text-transparent">
                Support us
              </h2>
              <h3 className="mt-2 border-b-2 pb-8 text-3xl font-extrabold leading-8 tracking-tight text-black sm:text-6xl">
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
                <p className="mt-8 text-lg font-semibold text-black">
                  For more info contact us:
                </p>
                <a
                  href="mailto:partnerships@codu.co"
                  className="z-20 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-2xl font-bold text-transparent"
                >
                  partnerships@codu.co
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="-z-10 bg-white lg:absolute lg:inset-0">
          <div className="bg-black lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
            <img
              className="h-56 w-full object-cover lg:absolute lg:h-full"
              src="/images/workshops/workshop-class.jpeg"
              alt="Developers working on their laptops at a table"
            />
          </div>
        </div>
      </main>
      <div className="bg-gradient-to-r from-orange-400 to-pink-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white">
            Previous sponsors include
          </h2>
          <div className="mt-8 flow-root lg:mt-10">
            <div className="-ml-8 -mt-4 flex flex-wrap justify-between lg:-ml-4">
              <div className="ml-8 mt-4 flex flex-shrink-0 flex-grow lg:ml-4 lg:flex-grow-0">
                <img
                  className="my-auto h-16"
                  src="/images/sponsors/harveynash.png"
                  alt="StaticKit"
                />
              </div>
              <div className="ml-8 mt-4 flex flex-shrink-0 flex-grow lg:ml-4 lg:flex-grow-0">
                <img
                  className="my-auto h-16"
                  src="/images/sponsors/version1.png"
                  alt="Version 1"
                />
              </div>
              <div className="ml-8 mt-4 flex flex-shrink-0 flex-grow lg:ml-4 lg:flex-grow-0">
                <img
                  className="my-auto h-12"
                  src="/images/sponsors/offerzen.png"
                  alt="Mirage"
                />
              </div>

              <div className="ml-8 mt-4 flex flex-shrink-0 flex-grow lg:ml-4 lg:flex-grow-0">
                <img
                  className="my-auto h-12"
                  src="/images/sponsors/learnupon.png"
                  alt="Transistor"
                />
              </div>
              <div className="ml-8 mt-4 flex flex-shrink-0 flex-grow lg:ml-4 lg:flex-grow-0">
                <img
                  className="my-auto h-12"
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
