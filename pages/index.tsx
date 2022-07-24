import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../components/Layout/Layout";
import { ArrowRightIcon } from "@heroicons/react/outline";

import {
  rules,
  benefits,
  highlighted_members,
  discordInviteUrl,
} from "../config/site_settings";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Codú | Homepage</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="relative">
          <main>
            <div className="pt-10 sm:pt-16 lg:pt-8 pb-14">
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
                        href={discordInviteUrl}
                        className="mt-4 inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-500 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-600"
                        target="_blank"
                        rel="noopener noreferrer"
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
                <div className="mx-auto max-w-prose lg:max-w-none lg:mx-0">
                  <h3 className="mt-10 sm:mt-12 pt-20 text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
                    Benefits
                  </h3>

                  <div className="grid sm:grid-cols-1 lg:grid-cols-3 lg:gap-16 lg:max-w-6xl">
                    {benefits.map(({ title, body }) => (
                      <div key={title} className="mt-8 flex flex-col">
                        <h2 className=" text-2xl font-semibold">{title}</h2>
                        <p className="my-2">{body}</p>
                      </div>
                    ))}
                  </div>
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
                  alt="Developers working on their laptops at a table"
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
              {rules.map(({ title, body }, i) => (
                <div className="flex flex-col mb-8 lg:mb-0" key={title}>
                  <div className="text-lg text-gray-400">{`${i + 1}/${
                    rules.length
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
                  {highlighted_members.map((person) => (
                    <li
                      key={person.imageUrl}
                      className="py-10 px-6 text-center xl:px-10 xl:text-left bg-black rounded-tr-[60px] rounded-bl-[60px]"
                    >
                      <div className="space-y-6 xl:space-y-10">
                        <img
                          className="mx-auto h-40 w-40 rounded-full xl:w-56 xl:h-56 border border-black"
                          src={person.imageUrl}
                          alt={`Profile picture for ${person.name}`}
                        />
                        <div className="text-center">
                          <div className="font-medium text-lg leading-6 space-y-1">
                            <h3 className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold text-xl">
                              {person.name}
                              {person.emoji && (
                                <span className="ml-2 text-black">
                                  {person.emoji}
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-500 font-light">
                              {person.role}
                            </p>
                          </div>

                          <ul
                            role="list"
                            className="flex justify-center space-x-5 mt-2"
                          >
                            {person.twitterUrl && (
                              <li>
                                <a
                                  href={person.twitterUrl}
                                  className="text-gray-500 hover:text-gray-400"
                                  target="_blank"
                                  rel="noopener noreferrer"
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
                            )}
                            {person.linkedinUrl && (
                              <li>
                                <a
                                  href={person.linkedinUrl}
                                  className="text-gray-500 hover:text-gray-400"
                                  target="_blank"
                                  rel="noopener noreferrer"
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
                            )}
                            {person.githubUrl && (
                              <li>
                                <a
                                  href={person.githubUrl}
                                  className="text-gray-500 hover:text-gray-400"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="sr-only">GitHub</span>
                                  <svg
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    className="w-6 h-6"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </a>
                              </li>
                            )}
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
