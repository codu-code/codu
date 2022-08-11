import type { NextPage } from "next";
import { useState } from "react";
import Layout from "../../components/Layout/Layout";
import { Switch } from "@headlessui/react";

const user = {
  name: "Debbie Lewis",
  handle: "deblewis",
  email: "debbielewis@example.com",
  imageUrl:
    "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=320&h=320&q=80",
};

function classNames(...classes: String[]) {
  return classes.filter(Boolean).join(" ");
}

const Settings: NextPage = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(false);

  return (
    <Layout>
      <div className="bg-gray-200 py-8">
        <div className="mx-auto lg:col-span-9 max-w-5xl flex-grow flex flex-col justify-center w-full px-4 sm:px-6">
          <div className="bg-white text-gray-800 border-2 border-black shadow-xl">
            <form action="#" method="POST">
              {/* Profile section */}
              <div className="py-6 px-4 sm:p-6 lg:pb-8">
                <div>
                  <h2 className="text-3xl tracking-tight font-extrabold text-black">
                    Profile Settings
                  </h2>
                  <p className="mt-1 text-gray-600">
                    This information will be displayed publicly so be careful
                    what you share.
                  </p>
                </div>

                <div>
                  <div className="flex-grow space-y-6">
                    <div className="mt-6 grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-6">
                        <label htmlFor="first-name">First name</label>
                        <input
                          type="text"
                          name="first-name"
                          id="first-name"
                          autoComplete="given-name"
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-6">
                        <label htmlFor="website">Last name</label>
                        <input
                          type="text"
                          name="website"
                          id="website"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="username">Username</label>
                      <div className="mt-1 shadow-sm flex">
                        <span className="mt-1  bg-black px-3 items-center text-white text-sm font-semibold flex">
                          codu.co/
                        </span>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          autoComplete="username"
                          defaultValue={user.handle}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="about">Short bio</label>
                      <div className="mt-1">
                        <textarea
                          id="about"
                          name="about"
                          rows={2}
                          defaultValue={""}
                          maxLength={200}
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-600 flex justify-between">
                        <p>Brief description for your profile.</p>
                        <span>{`${100}/200`}</span>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-9">
                        <label htmlFor="location">Location</label>
                        <input
                          type="text"
                          name="location"
                          id="location"
                          placeholder="The moon 🌙"
                          autoComplete="country-name"
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-9">
                        <label htmlFor="website">Website URL</label>
                        <input
                          type="text"
                          name="website"
                          id="website"
                          autoComplete="url"
                          placeholder="https://codu.co/"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 divide-y divide-gray-200">
                    <div>
                      <div>
                        <h2 className="text-xl tracking-tight font-bold text-black">
                          Privacy
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          We respect your privacy, change your settings here.
                        </p>
                      </div>
                      <ul role="list" className="mt-2 divide-y divide-gray-200">
                        <Switch.Group
                          as="li"
                          className="py-4 flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <Switch.Label
                              as="p"
                              className="text-sm font-medium text-gray-900"
                              passive
                            >
                              Email notifications
                            </Switch.Label>
                            <Switch.Description className="text-sm text-gray-600">
                              Occasional email notifications from the platform.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                            className={classNames(
                              emailNotifications
                                ? "bg-green-600"
                                : "bg-gray-200",
                              "ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                emailNotifications
                                  ? "translate-x-5"
                                  : "translate-x-0",
                                "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                              )}
                            />
                          </Switch>
                        </Switch.Group>
                        <Switch.Group
                          as="li"
                          className="py-4 flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <Switch.Label
                              as="p"
                              className="text-sm font-medium text-gray-900"
                              passive
                            >
                              Weekly newsletter
                            </Switch.Label>
                            <Switch.Description className="text-sm text-gray-600">
                              Opt-in to our weekly newsletter.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={weeklyNewsletter}
                            onChange={setWeeklyNewsletter}
                            className={classNames(
                              weeklyNewsletter ? "bg-green-600" : "bg-gray-200",
                              "ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                weeklyNewsletter
                                  ? "translate-x-5"
                                  : "translate-x-0",
                                "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                              )}
                            />
                          </Switch>
                        </Switch.Group>
                      </ul>
                    </div>
                    <div className="mt-4 py-4 flex justify-end">
                      <button
                        type="button"
                        className="bg-white border border-gray-300 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="ml-5 w-20 bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
