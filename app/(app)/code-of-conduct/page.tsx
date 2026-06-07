import { Eyebrow } from "@/components/ds";

export const metadata = {
  title: "Code of conduct",
  description:
    "We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone",
};

const CodeOfConduct = () => {
  return (
    <section className="mx-auto max-w-prose px-5 py-16 sm:px-8 sm:py-20">
      <header className="border-b border-hairline pb-8">
        <Eyebrow>code of conduct</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-fg sm:text-6xl">
          Code Of Conduct
        </h1>
      </header>

      <div className="prose mt-12">
        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Support us
        </h2>
        <p className="mt-3 text-lg text-muted">
          We as members, contributors, and leaders pledge to make participation
          in our community a harassment-free experience for everyone, regardless
          of age, body size, visible or invisible disability, ethnicity, sex
          characteristics, gender identity and expression, level of experience,
          education, socio-economic status, nationality, personal appearance,
          race, caste, color, religion, or sexual identity and orientation.
        </p>
        <p className="mt-3 text-lg text-muted">
          We pledge to act and interact in ways that contribute to an open,
          welcoming, diverse, inclusive, and healthy community.
        </p>

        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Our Standards
        </h2>
        <p className="mt-3 text-lg text-muted">
          Examples of behavior that contributes to a positive environment for
          our community include:
        </p>
        <ul className="mt-3 list-disc pl-8 text-lg text-muted">
          <li className="my-4">
            Demonstrating empathy and kindness toward other people
          </li>
          <li className="my-4">
            Being respectful of differing opinions, viewpoints, and experiences
          </li>
          <li className="my-4">
            Giving and gracefully accepting constructive feedback
          </li>
          <li className="my-4">
            Accepting responsibility and apologizing to those affected by our
            mistakes, and learning from the experience
          </li>
          <li className="my-4">
            Focusing on what is best not just for us as individuals, but for the
            overall community
          </li>
        </ul>

        <p className="mt-3 text-lg text-muted">
          Examples of unacceptable behavior include:
        </p>
        <ul className="mt-3 list-disc pl-8 text-lg text-muted">
          <li className="my-4">
            The use of sexualized language or imagery, and sexual attention or
            advances of any kind
          </li>
          <li className="my-4">
            Trolling, insulting or derogatory comments, and personal or
            political attacks
          </li>
          <li className="my-4">Public or private harassment</li>
          <li className="my-4">
            Publishing others’ private information, such as a physical or email
            address, without their explicit permission
          </li>
          <li className="my-4">
            Other conduct which could reasonably be considered inappropriate in
            a professional setting
          </li>
        </ul>

        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Enforcement Responsibilities
        </h2>
        <p className="mt-3 text-lg text-muted">
          Project maintainers are responsible for clarifying and enforcing our
          standards of acceptable behavior and will take appropriate and fair
          corrective action in response to any behavior that they deem
          inappropriate, threatening, offensive, or harmful.
        </p>
        <p className="mt-3 text-lg text-muted">
          Project maintainers have the right and responsibility to remove, edit,
          or reject comments, commits, code, wiki edits, issues, and other
          contributions that are not aligned to this Code of Conduct, and will
          communicate reasons for moderation decisions when appropriate.
        </p>

        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Scope
        </h2>
        <p className="mt-3 text-lg text-muted">
          This Code of Conduct applies within all community spaces, and also
          applies when an individual is officially representing the community in
          public spaces. Examples of representing our community include using an
          official e-mail address, posting via an official social media account,
          or acting as an appointed representative at an online or offline event.
        </p>

        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Enforcement
        </h2>
        <p className="mt-3 text-lg text-muted">
          Instances of abusive, harassing, or otherwise unacceptable behavior
          may be reported to the project team responsible for enforcement at{" "}
          <a className="font-bold text-accent" href="mailto:hi@codu.co">
            hi@codu.co
          </a>
          . All complaints will be reviewed and investigated promptly and
          fairly.
        </p>

        <h2 className="mb-4 mt-12 text-xl font-semibold leading-6 tracking-wide text-fg">
          Attribution
        </h2>
        <p className="mt-3 text-lg text-muted">
          This Code of Conduct is adapted from the{" "}
          <a
            className="font-bold text-accent"
            href="https://www.contributor-covenant.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contributor Covenant
          </a>
          , version 2.1, available at{" "}
          <a
            href="https://www.contributor-covenant.org/version/2/1/code_of_conduct/"
            className="break-words font-bold text-accent lg:whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            www.contributor-covenant.org/version/2/1/code_of_conduct/
          </a>
        </p>
      </div>
    </section>
  );
};

export default CodeOfConduct;
