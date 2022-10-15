import type { NextPage } from "next";
import React from "react";
import Layout from "../../components/Layout/Layout";

const CodeOfConduct: NextPage = () => {
  return (
    <Layout>
      <div>
        <main className="bg-white  relative">
          <div className="relative pt-12 pb-16 px-4 sm:pt-16 sm:px-6 lg:px-8 lg:max-w-8xl lg:mx-auto ">
            <div className="lg:pl-8">
              <div className="text-base max-w-prose mx-auto  ">
                <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-black sm:text-6xl pb-8 border-b-2">
                  Code Of Conduct
                </h1>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Support us</h2>
                <p className="mt-3 text-lg text-gray-500">
                  We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for
                  everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity
                  and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste,
                  color, religion, or sexual identity and orientation.
                </p>
                <p className="mt-3 text-lg text-gray-500">
                  We pledge to act and interact in ways that contribute to an open, welcoming, diverse, inclusive, and healthy community.
                </p>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Our Standards</h2>
                <p className="mt-3 text-lg text-gray-500">
                  Examples of behavior that contributes to a positive environment for our community include:
                </p>
                <ul className="text-lg text-gray-500 list-disc mt-3 pl-8">
                  <li className="my-4">Demonstrating empathy and kindness toward other people</li>
                  <li className="my-4">Being respectful of differing opinions, viewpoints, and experiences</li>
                  <li className="my-4">Giving and gracefully accepting constructive feedback</li>
                  <li className="my-4">
                    Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience
                  </li>
                  <li className="my-4">Focusing on what is best not just for us as individuals, but for the overall community</li>
                </ul>

                <p className="mt-3 text-lg text-gray-500">Examples of unacceptable behavior include:</p>
                <ul className="text-lg text-gray-500 list-disc mt-3 pl-8">
                  <li className="my-4">The use of sexualized language or imagery, and sexual attention or advances of any kind</li>
                  <li className="my-4">Trolling, insulting or derogatory comments, and personal or political attacks</li>
                  <li className="my-4">Public or private harassment</li>
                  <li className="my-4">
                    Publishing others’ private information, such as a physical or email address, without their explicit permission
                  </li>
                  <li className="my-4">Other conduct which could reasonably be considered inappropriate in a professional setting</li>
                </ul>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Enforcement Responsibilities</h2>
                <p className="mt-3 text-lg text-gray-500">
                  Project maintainers are responsible for clarifying and enforcing our standards of acceptable behavior and will take
                  appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive,
                  or harmful.
                </p>
                <p className="mt-3 text-lg text-gray-500">
                  Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits,
                  issues, and other contributions that are not aligned to this Code of Conduct, and will communicate reasons for moderation
                  decisions when appropriate.
                </p>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Scope</h2>
                <p className="mt-3 text-lg text-gray-500">
                  This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing
                  the community in public spaces. Examples of representing our community include using an official e-mail address, posting
                  via an official social media account, or acting as an appointed representative at an online or offline event.
                </p>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Enforcement</h2>
                <p className="mt-3 text-lg text-gray-500">
                  Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team responsible for
                  enforcement at{" "}
                  <a
                    className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 text-1xl font-bold"
                    href="mailto:hi@codu.co"
                  >
                    hi@codu.co
                  </a>
                  . All complaints will be reviewed and investigated promptly and fairly.
                </p>

                <h2 className="text-xl leading-6 font-semibold tracking-wide text-black mt-12 mb-4">Attribution</h2>
                <p className="mt-3 text-lg text-gray-500">
                  This Code of Conduct is adapted from the{" "}
                  <a
                    className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 text-1xl font-bold"
                    href="https://www.contributor-covenant.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contributor Covenant
                  </a>
                  , version 2.1, available at{" "}
                  <a
                    href="https://www.contributor-covenant.org/version/2/1/code_of_conduct/"
                    className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 text-lg font-bold lg:whitespace-nowrap break-words"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.contributor-covenant.org/version/2/1/code_of_conduct/
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default CodeOfConduct;
