import type { NextPage } from "next";
import { Fragment } from "react";

import Head from "next/head";

import Layout from "../components/Layout/Layout";

import { ArrowRightIcon } from "@heroicons/react/outline";

const people = [
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
  {
    name: "Leonard Krasner",
    role: "Senior Designer",
    imageUrl:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
];

const services = [
  {
    title: "Job opportunities",
    body: "Launching a product is complex. Our product strategy services help you define where to focus your effort.",
    url: "#",
  },
  {
    title: "Mentorship",
    body: "Unsure about quality? If you outsourced a tech project it's not easy to understand the quality of the solution.",
    url: "#",
  },
  {
    title: "Open Source Software",
    body: "Building together is fun! Contribute to open source software with other members.",
    url: "#",
  },
];

const steps = [
  {
    title: "Introduce yourself!",
    body: "Please introduce yourself, a little about you such as your current job, your goals and where you are from when you enter the group! We want you to share who you are and where you’re from.",
  },
  {
    title: "Be kind and respectful",
    body: "Together let’s build a positive, welcoming environment where everyone feels safe to share ideas, thoughts, and feedback. Let’s be supportive, respect individual opinions, and report inappropriate posts if needed.",
  },
  {
    title: "Give more than you take",
    body: "There will always be opportunities to help another person with so many people and levels. We are here to support you, so make sure you try to support others in the community too.",
  },

  {
    title: "Don't double post",
    body: "When asking questions or posting things, look for the most relevant channel and post it there — posting across channels or repeating questions pollutes the conversations for everyone.",
  },
];

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Codú | Homepage</title>
        <meta name="description" content="Codú | New Site Coming Soon" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="relative">
          <main>
            <div className="pt-10 sm:pt-16 lg:pt-8 lg:pb-14">
              <div className="mx-auto max-w-6xl lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                  <div className="lg:hidden -mt-20 lg:m-0 lg:relative">
                    <div className="relative mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                      <img
                        className="w-full lg:absolute lg:inset-y-0 lg:h-full lg:w-auto lg:max-w-none"
                        src="/images/cloud.png"
                        alt=""
                      />
                    </div>
                  </div>
                  <div className="-mt-20 lg:mt-0 mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
                    <div className="lg:py-24">
                      <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                        A space for{" "}
                        <span className="pb-3  bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 sm:pb-5">
                          coders
                        </span>
                        .
                      </h1>
                      <p className="pt-2 text-base text-gray-300 sm:text-xl lg:text-lg xl:text-xl">
                        Join the Codú community today and become part of the
                        most supportive community of developers out there!
                      </p>
                      <a
                        href="#"
                        className="mt-4 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-500 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-600"
                      >
                        Join the community
                        <svg
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          className="ml-2"
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d="M10.076 11c.6 0 1.086.45 1.075 1 0 .55-.474 1-1.075 1C9.486 13 9 12.55 9 12s.475-1 1.076-1zm3.848 0c.601 0 1.076.45 1.076 1s-.475 1-1.076 1c-.59 0-1.075-.45-1.075-1s.474-1 1.075-1zm4.967-9C20.054 2 21 2.966 21 4.163V23l-2.211-1.995-1.245-1.176-1.317-1.25.546 1.943H5.109C3.946 20.522 3 19.556 3 18.359V4.163C3 2.966 3.946 2 5.109 2H18.89zm-3.97 13.713c2.273-.073 3.148-1.596 3.148-1.596 0-3.381-1.482-6.122-1.482-6.122-1.48-1.133-2.89-1.102-2.89-1.102l-.144.168c1.749.546 2.561 1.334 2.561 1.334a8.263 8.263 0 0 0-3.096-1.008 8.527 8.527 0 0 0-2.077.02c-.062 0-.114.011-.175.021-.36.032-1.235.168-2.335.662-.38.178-.607.305-.607.305s.854-.83 2.705-1.376l-.103-.126s-1.409-.031-2.89 1.103c0 0-1.481 2.74-1.481 6.121 0 0 .864 1.522 3.137 1.596 0 0 .38-.472.69-.871-1.307-.4-1.8-1.24-1.8-1.24s.102.074.287.179c.01.01.02.021.041.031.031.022.062.032.093.053.257.147.514.262.75.357.422.168.926.336 1.513.452a7.06 7.06 0 0 0 2.664.01 6.666 6.666 0 0 0 1.491-.451c.36-.137.761-.337 1.183-.62 0 0-.514.861-1.862 1.25.309.399.68.85.68.85z" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="hidden lg:block mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
                    <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                      <img
                        className="w-full lg:absolute lg:inset-y-0 lg:w-auto lg:max-w-full"
                        src="/images/cloud.png"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-1 lg:grid-cols-3 mt-10 sm:mt-12 lg:gap-16 lg:max-w-6xl py-20 sm:px-6 px-4 max-w-prose mx-auto">
                  {services.map(({ title, body, url }) => (
                    <div key={url} className="mt-8 flex flex-col">
                      <h2 className=" text-2xl font-semibold">{title}</h2>
                      <p className="my-2">{body}</p>
                      <a className="font-semibold underline" href={url}>
                        Read more
                        <ArrowRightIcon
                          className="inline  ml-2 h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
          <section className="relative bg-white">
            <div className="lg:absolute lg:inset-0">
              <div className="lg:absolute lg:inset-y-0 lg:left-0 lg:w-1/2">
                <img
                  className="h-56 w-full object-cover lg:absolute lg:h-full"
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
                  alt=""
                />
              </div>
            </div>
            <div className="relative pt-12 pb-16 px-4 sm:pt-16 sm:px-6 lg:px-8 lg:max-w-7xl lg:mx-auto lg:grid lg:grid-cols-2">
              <div className="lg:col-start-2 lg:pl-8">
                <div className="text-base max-w-prose mx-auto lg:max-w-lg lg:ml-auto lg:mr-0">
                  <h2 className="text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
                    What are you waiting for?
                  </h2>
                  <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-black sm:text-6xl pb-8 border-b-2">
                    Why Codú?
                  </h3>
                  <p className="mt-8 text-lg text-gray-500">
                    Developers, rejoice! Codú is the ultimate community for web
                    developers. Here you can learn from your peers, get support
                    when you need it, and collaborate on projects big and small.
                  </p>
                  <p className="mt-3 text-lg text-gray-500">
                    {`Codú is the perfect place to sharpen your skills and build
                    your portfolio. With Codú, there's no such thing as a stupid
                    question - we're all here to help each other grow as
                    developers. Plus, our community makes it easy to find
                    collaborators for your next big project.`}
                  </p>
                  <p className="mt-3 text-lg text-gray-500">
                    So what are you waiting for? Join Codú today and become part
                    of the most supportive community of developers out there!
                  </p>
                  <blockquote className="text-black mt-8 text-lg border-l-4 pl-4 font-semibold">
                    <p>
                      “Alone, we can do so little; together we can do so much” -
                      Helen Keller.
                    </p>
                  </blockquote>
                </div>
              </div>
            </div>
          </section>
          <section className="lg:max-w-6xl py-20 sm:px-6 px-4 max-w-prose mx-auto">
            <h2 className="text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
              Our hourse rules
            </h2>
            <div className="lg:grid grid-cols-2 gap-16 py-4">
              {steps.map(({ title, body }, i) => (
                <div className="flex flex-col mb-8 lg:mb-0" key={title}>
                  <div className="text-lg text-gray-400">{`${i + 1}/${
                    steps.length
                  }`}</div>
                  <h4 className="text-3xl leading-8 font-extrabold tracking-tight sm:text-5xl">
                    {title}
                  </h4>
                  <p className="text-md mt-3">{body}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white text-black">
            <div className="mx-auto py-12 px-4 lg:max-w-6xl sm:px-6 lg:px-8 lg:py-24 max-w-prose">
              <div className="space-y-12">
                <div className="space-y-5 sm:space-y-4 md:max-w-xl lg:max-w-3xl xl:max-w-none">
                  <h2 className="text-3xl font-extrabold text-black tracking-tight sm:text-4xl">
                    Highlighted members
                  </h2>
                  <p className="text-xl text-gray-500">
                    Our members are better than yours. 😉 This is where we give
                    a little spotlight to some of our awesome members.
                  </p>
                </div>
                <ul
                  role="list"
                  className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 lg:grid-cols-3 lg:gap-8"
                >
                  {people.map((person) => (
                    <li
                      key={person.imageUrl}
                      className="py-10 px-6 bg-white text-center rounded-lg xl:px-10 xl:text-left border border-r border-black"
                    >
                      <div className="space-y-6 xl:space-y-10">
                        <img
                          className="mx-auto h-40 w-40 rounded-full xl:w-56 xl:h-56 border border-black"
                          src={person.imageUrl}
                          alt=""
                        />
                        <div className="space-y-2 xl:flex xl:items-center xl:justify-between">
                          <div className="font-medium text-lg leading-6 space-y-1">
                            <h3 className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold text-xl">
                              {person.name}
                            </h3>
                            <p className="text-gray-800 font-light">
                              {person.role}
                            </p>
                          </div>

                          <ul
                            role="list"
                            className="flex justify-center space-x-5"
                          >
                            <li>
                              <a
                                href={person.twitterUrl}
                                className="text-black hover:text-gray-800"
                              >
                                <span className="sr-only">Twitter</span>
                                <svg
                                  className="w-5 h-5"
                                  aria-hidden="true"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                              </a>
                            </li>
                            <li>
                              <a
                                href={person.linkedinUrl}
                                className="text-black hover:text-gray-800"
                              >
                                <span className="sr-only">LinkedIn</span>
                                <svg
                                  className="w-5 h-5"
                                  aria-hidden="true"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default Home;
