export const metadata = {
  title: "Code of conduct",
  description:
    "We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone",
};

const CodeOfConduct = () => {
  return (
    <div>
      <main className="relative bg-white p-4 shadow-lg dark:border-neutral-600 dark:border-l-pink-600 dark:bg-neutral-900">
        <div className="lg:max-w-8xl relative px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:mx-auto lg:px-8">
          <div className="lg:pl-8">
            <div className="mx-auto max-w-prose text-base">
              <h1 className="mt-2 border-b-2 pb-8 text-3xl font-extrabold leading-8 tracking-tight text-black dark:text-white sm:text-6xl">
                Code Of Conduct
              </h1>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Support us
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                We as members, contributors, and leaders pledge to make
                participation in our community a harassment-free experience for
                everyone, regardless of age, body size, visible or invisible
                disability, ethnicity, sex characteristics, gender identity and
                expression, level of experience, education, socio-economic
                status, nationality, personal appearance, race, caste, color,
                religion, or sexual identity and orientation.
              </p>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                We pledge to act and interact in ways that contribute to an
                open, welcoming, diverse, inclusive, and healthy community.
              </p>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Our Standards
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                Examples of behavior that contributes to a positive environment
                for our community include:
              </p>
              <ul className="mt-3 list-disc pl-8 text-lg text-neutral-500 dark:text-white">
                <li className="my-4">
                  Demonstrating empathy and kindness toward other people
                </li>
                <li className="my-4">
                  Being respectful of differing opinions, viewpoints, and
                  experiences
                </li>
                <li className="my-4">
                  Giving and gracefully accepting constructive feedback
                </li>
                <li className="my-4">
                  Accepting responsibility and apologizing to those affected by
                  our mistakes, and learning from the experience
                </li>
                <li className="my-4">
                  Focusing on what is best not just for us as individuals, but
                  for the overall community
                </li>
              </ul>

              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                Examples of unacceptable behavior include:
              </p>
              <ul className="mt-3 list-disc pl-8 text-lg text-neutral-500 dark:text-white">
                <li className="my-4">
                  The use of sexualized language or imagery, and sexual
                  attention or advances of any kind
                </li>
                <li className="my-4">
                  Trolling, insulting or derogatory comments, and personal or
                  political attacks
                </li>
                <li className="my-4">Public or private harassment</li>
                <li className="my-4">
                  Publishing others’ private information, such as a physical or
                  email address, without their explicit permission
                </li>
                <li className="my-4">
                  Other conduct which could reasonably be considered
                  inappropriate in a professional setting
                </li>
              </ul>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Enforcement Responsibilities
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                Project maintainers are responsible for clarifying and enforcing
                our standards of acceptable behavior and will take appropriate
                and fair corrective action in response to any behavior that they
                deem inappropriate, threatening, offensive, or harmful.
              </p>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                Project maintainers have the right and responsibility to remove,
                edit, or reject comments, commits, code, wiki edits, issues, and
                other contributions that are not aligned to this Code of
                Conduct, and will communicate reasons for moderation decisions
                when appropriate.
              </p>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Scope
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                This Code of Conduct applies within all community spaces, and
                also applies when an individual is officially representing the
                community in public spaces. Examples of representing our
                community include using an official e-mail address, posting via
                an official social media account, or acting as an appointed
                representative at an online or offline event.
              </p>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Enforcement
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                Instances of abusive, harassing, or otherwise unacceptable
                behavior may be reported to the project team responsible for
                enforcement at{" "}
                <a
                  className="text-1xl z-20 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text font-bold text-transparent"
                  href="mailto:hi@codu.co"
                >
                  hi@codu.co
                </a>
                . All complaints will be reviewed and investigated promptly and
                fairly.
              </p>

              <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-black dark:text-white">
                Attribution
              </h2>
              <p className="mt-3 text-lg text-neutral-500 dark:text-white">
                This Code of Conduct is adapted from the{" "}
                <a
                  className="text-1xl z-20 bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text font-bold text-transparent"
                  href="https://www.contributor-covenant.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contributor Covenant
                </a>
                , version 2.1, available at{" "}
                <a
                  href="https://www.contributor-covenant.org/version/2/1/code_of_conduct/"
                  className="z-20 break-words bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-lg font-bold text-transparent lg:whitespace-nowrap"
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
  );
};

export default CodeOfConduct;
