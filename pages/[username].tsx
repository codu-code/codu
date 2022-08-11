import type { NextPage } from "next";
import { useState } from "react";
import Layout from "../components/Layout/Layout";

import { authors } from "../config/site_settings";

import { useRouter } from "next/router";

import ArticlePreview from "../components/ArticlePreview/ArticlePreview";

const articles = [
  {
    cover_image: "https://media.giphy.com/media/72vhYQZVjvTjNOCH7u/giphy.gif",
    date: "2021-01-12",
    description:
      "Sometimes you would like to suggest some options to a user as they type something into an input. Maybe there are popular search categories or tags that people are looking for. You could, of course, implement an API driven feature, or if you want to get a quick way for it to be up and running why not just use the datalist tag?",
    published: true,
    read_time: "2 min",
    slug: "easy-autocomplete-suggestions-for-inputs-with-just-html5-datalist-tag",
    tags: "beginners, codenewbie, html, webdev",
    title:
      "🔎 Easy Autocomplete / Suggestions for Inputs with just HTML5 | datalist tag",
    user_id: "nialljoemaher",
  },
  {
    cover_image: "https://media.giphy.com/media/72vhYQZVjvTjNOCH7u/giphy.gif",
    date: "2021-01-12",
    description:
      "Sometimes you would like to suggest some options to a user as they type something into an input. Maybe there are popular search categories or tags that people are looking for. You could, of course, implement an API driven feature, or if you want to get a quick way for it to be up and running why not just use the datalist tag?",
    published: true,
    read_time: "2 min",
    slug: "easy-autocomplete-suggestions-for-inputs-with-just-html5-datalist-tag",
    tags: "beginners, codenewbie, html, webdev",
    title:
      "🔎 Easy Autocomplete / Suggestions for Inputs with just HTML5 | datalist tag",
    user_id: "nialljoemaher",
  },
  {
    cover_image: "https://media.giphy.com/media/72vhYQZVjvTjNOCH7u/giphy.gif",
    date: "2021-01-12",
    description:
      "Sometimes you would like to suggest some options to a user as they type something into an input. Maybe there are popular search categories or tags that people are looking for. You could, of course, implement an API driven feature, or if you want to get a quick way for it to be up and running why not just use the datalist tag?",
    published: true,
    read_time: "2 min",
    slug: "easy-autocomplete-suggestions-for-inputs-with-just-html5-datalist-tag",
    tags: "beginners, codenewbie, html, webdev",
    title:
      "🔎 Easy Autocomplete / Suggestions for Inputs with just HTML5 | datalist tag",
    user_id: "nialljoemaher",
  },
];

const empty = [];

const Profile: NextPage = () => {
  const router = useRouter();
  const { username } = router.query;

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(false);

  if (!authors[username || ""]) return null;
  const { name, imageUrl, bio } = authors[username || ""];
  return (
    <Layout>
      <div className="border-t-2">
        <div className="max-w-xl px-4 mx-auto text-white">
          <main className="flex pt-6">
            <div className="mr-4 flex-shrink-0 self-center">
              <img
                className="rounded-full h-28 w-28"
                alt={`Avatar for ${name}`}
                src={imageUrl}
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-xl font-bold mb-0">{name}</h1>
              <h2 className="text-gray-400 font-bold text-sm">@{username}</h2>
              <p className="mt-1">{bio}</p>
            </div>
          </main>
          <div className="pb-3 border-b border-gray-200 pt-8">
            <h3 className="text-2xl leading-6 font-medium">
              Published articles
            </h3>
          </div>
          {articles ? (
            articles.map(
              ({ slug, title, description, user_id, read_time, date }: any) => (
                <ArticlePreview
                  key={slug}
                  slug={slug}
                  title={title}
                  description={description}
                  author={authors[user_id]}
                  date={date}
                  readTime={read_time}
                />
              )
            )
          ) : (
            <p className="font-medium py-4">Nothing published yet... 🥲</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
