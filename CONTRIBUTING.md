## 👨‍💻 Prerequisite Skills to Contribute

- [Git](https://git-scm.com/)

#### Contribute in Documents

- [Markdown](https://www.markdownguide.org/basic-syntax/)

#### Contribute in Code

- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind](https://tailwindcss.com/)

---

## 💥 How to Contribute

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/codu-code/codu/pulls)

- Take a look at the existing [Issues](https://github.com/codu-code/codu/issues) or [create a new issue](https://github.com/codu-code/codu/issues/new/choose)!
- [Fork the Repo](https://github.com/codu-code/codu/fork). Then, create a branch for any issue that you are working on. Finally, commit your work.
- Create a **[Pull Request](https://github.com/codu-code/codu/compare)** (_PR_), which will be promptly reviewed and given suggestions for improvements by the community.
- Add screenshots or screen captures to your Pull Request to help us understand the effects of the changes proposed in your PR.

---

## ⭐ HOW TO MAKE A PULL REQUEST:

**1.** Start by making a Fork of the [**codu**](https://github.com/codu-code/codu) repository. Click on the <a href="https://github.com/codu-code/codu/fork"><img src="https://i.imgur.com/G4z1kEe.png" height="21" width="21"></a>Fork symbol at the top right corner.

**2.** Clone your new fork of the repository in the terminal/CLI on your computer with the following command:

```bash
git clone https://github.com/<your-github-username>/codu
```

**3.** Navigate to the newly created codu project directory:

```bash
cd codu
```

**4.** Set upstream command:

```bash
git remote add upstream https://github.com/codu-code/codu.git
```

**5.** Create a new branch:

```bash
git checkout -b YourBranchName
```

**6.** Sync your fork or your local repository with the origin repository:

- In your forked repository, click on "Fetch upstream"
- Click "Fetch and merge"

### Alternatively, Git CLI way to Sync forked repository with origin repository:

```bash
git fetch upstream
```

```bash
git rebase upstream/develop
```

### [Github Docs](https://docs.github.com/en/github/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-on-github) for Syncing

**7.** Make your changes to the source code.

**8.** Stage your changes:

⚠️ **Make sure** not to commit `package.json` or `package-lock.json` file

⚠️ **Make sure** not to run the commands `git add .` or `git add *`

> Instead, stage your changes for each file/folder
>
> By using public path it means it will add all files and folders under that folder, it is better to be specific

```bash
git add public
```

_or_

```bash
git add "<files_you_have_changed>"
```

**9.** Commit your changes:

```bash
git commit -m "<your_commit_message>"
```

**10.** Push your local commits to the remote repository:

```bash
git push origin YourBranchName
```

**11.** Create a [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)!

**12.** **Congratulations!** You've made your first contribution to [**codu**](https://github.com/codu-code/codu/graphs/contributors)! 🙌🏼

**_:trophy: After this, the maintainers will review the PR and will merge it if it helps move the codu project forward. Otherwise, it will be given constructive feedback and suggestions for the changes needed to add the PR to the codebase._**

---

## Run tests

⚠️ **_Tests are WIP. When commands are added update the docs here._** ⚠️

For e2e tests we are using playwright

After making changes make sure that tests passes

To create a e2e test make a file in `/e2e` directory 

**1.** Start the codu application by typing this command:

```bash
yarn dev
```

**2.** Perform the e2e tests by typing this command:

```bash
yarn test:e2e
```

Read Playwright [documentation](https://playwright.dev/)


---

## Style Guide for Git Commit Messages :memo:

**How you can add more value to your contribution logs:**

- Use the present tense. (Example: "Add feature" instead of "Added feature")
- Use the imperative mood. (Example: "Move item to...", instead of "Moves item to...")
- Limit the first line (also called the Subject Line) to _50 characters or less_.
- Capitalize the Subject Line.
- Separate subject from body with a blank line.
- Do not end the subject line with a period.
- Wrap the body at _72 characters_.
- Use the body to explain the _what_, _why_, _vs_, and _how_.
- Reference [Issues](https://github.com/codu-code/codu/issues) and [Pull Requests](https://github.com/codu-code/codu/pulls) liberally after the first line.

---

## 💥 Issues

In order to discuss changes, you are welcome to [open an issue](https://github.com/codu-code/codu/issues/new/choose) about what you would like to contribute. Enhancements are always encouraged and appreciated.

[![forthebadge](https://forthebadge.com/images/badges/works-on-my-machine.svg)](https://forthebadge.com)

[![Open Source Love](https://badges.frapsoft.com/os/v2/open-source-150x25.png?v=103)](https://github.com/ellerbrock/open-source-badges/)
