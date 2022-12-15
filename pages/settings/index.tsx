import type {
  NextPage,
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { customAlphabet } from "nanoid";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useState } from "react";
import { Switch } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import prisma from "../../server/db/client";
import toast, { Toaster } from "react-hot-toast";

import Layout from "../../components/Layout/Layout";
import type { saveSettingsInput } from "../../schema/profile";
import { saveSettingsSchema } from "../../schema/profile";
import superjson from "superjson";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Settings: NextPage = ({
  profile,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<saveSettingsInput>({
    resolver: zodResolver(saveSettingsSchema),
    defaultValues: { ...profile },
  });

  const bio = watch("bio");
  const username = watch("username");

  const router = useRouter();

  const { emailNotifications: eNotifications, newsletter } = profile;

  const [emailNotifications, setEmailNotifications] = useState(eNotifications);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(newsletter);

  const { mutate } = trpc.profile.edit.useMutation({
    onError() {
      toast.error("Something went wrong saving settings.");
    },
    onSuccess() {
      router.push(`/${username}`);
    },
  });

  const onSubmit: SubmitHandler<saveSettingsInput> = (values) => {
    mutate({ ...values, newsletter: weeklyNewsletter, emailNotifications });
  };

  return (
    <Layout>
      <div className="bg-black py-8">
        <Toaster
          toastOptions={{
            style: {
              borderRadius: 0,
              border: "2px solid black",
              background: "white",
            },
          }}
        />
        <div className="mx-auto lg:col-span-9 max-w-2xl flex-grow flex flex-col justify-center w-full px-4 sm:px-6">
          <div className="bg-smoke text-gray-800 border-2 border-white shadow shadow-slate-50">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Profile section */}
              <div className="py-6 px-4 sm:p-6 lg:pb-8">
                <div>
                  <h2 className="text-3xl tracking-tight font-extrabold text-white">
                    Profile Settings
                  </h2>
                  <p className="mt-1 text-gray-400">
                    This information will be displayed publicly so be careful
                    what you share.
                  </p>
                </div>

                <div>
                  <div className="flex-grow space-y-6">
                    <div className="mt-6 grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-9">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          {...register("name")}
                          autoComplete="given-name"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {`${errors.name.message || "Required"}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="username">Username</label>
                      <div className="mt-1 shadow-sm flex">
                        <span className="mt-1  bg-white px-3 items-center text-black text-sm font-semibold flex">
                          codu.co/
                        </span>
                        <input type="text" {...register("username")} />
                      </div>
                      {errors.username && (
                        <p className="mt-1 text-sm text-red-600">
                          {`${errors.username.message || "Required"}`}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="bio">Short bio</label>
                      <div className="mt-1">
                        <textarea
                          {...register("bio")}
                          rows={2}
                          defaultValue={""}
                          maxLength={200}
                        />
                      </div>
                      <div className="mt-2 text-sm text-gray-400 flex justify-between">
                        {errors.bio ? (
                          <p className="mt-1 text-sm text-red-600">
                            {`${errors.bio.message || "Required"}`}
                          </p>
                        ) : (
                          <>
                            <p>Brief description for your profile.</p>
                            <span>{`${bio?.length || 0}/200`}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-12 gap-6">
                      <div className="col-span-12 sm:col-span-9">
                        <label htmlFor="location">Location</label>
                        <input
                          type="text"
                          {...register("location")}
                          placeholder="The moon 🌙"
                          autoComplete="country-name"
                        />
                        {errors.location && (
                          <p className="mt-1 text-sm text-red-600">
                            {`${
                              errors.location.message ||
                              "Something is wrong with the input"
                            }`}
                          </p>
                        )}
                      </div>

                      <div className="col-span-12 sm:col-span-9">
                        <label htmlFor="websiteUrl">Website URL</label>
                        <input
                          type="text"
                          {...register("websiteUrl")}
                          autoComplete="url"
                          placeholder="https://codu.co/"
                        />
                        {errors.websiteUrl && (
                          <p className="mt-1 text-sm text-red-600">
                            {`${
                              errors.websiteUrl.message ||
                              "Something is wrong with the input"
                            }`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 divide-y divide-gray-200">
                    <div>
                      <div>
                        <h2 className="text-xl tracking-tight font-bold text-white">
                          Privacy
                        </h2>
                        <p className="mt-1 text-sm text-gray-400">
                          We respect your privacy, change your settings here.
                        </p>
                      </div>
                      <ul role="list" className="mt-2 divide-y divide-gray-200">
                        <Switch.Group
                          as="li"
                          className="py-4 flex items-center justify-between"
                        >
                          <div className="flex flex-col items-center">
                            <Switch.Label as="p" className="sr-only" passive>
                              Email notifications
                            </Switch.Label>
                            <Switch.Description className="text-sm text-gray-400">
                              Occasional email notifications from the platform.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                            className={classNames(
                              emailNotifications
                                ? "bg-green-600"
                                : "bg-gray-400",
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
                          className="py-4 flex items-center justify-between mt-2"
                        >
                          <div className="flex flex-col">
                            <Switch.Label as="p" className="sr-only" passive>
                              Weekly newsletter
                            </Switch.Label>
                            <Switch.Description className="text-sm text-gray-400">
                              Opt-in to our weekly newsletter.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={weeklyNewsletter}
                            onChange={setWeeklyNewsletter}
                            className={classNames(
                              weeklyNewsletter ? "bg-green-600" : "bg-gray-400",
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
                    <div className="mt-2 py-4 flex justify-end">
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user?.username) {
    const nanoid = customAlphabet("1234567890abcdef", 3);
    const initialUsername = `${(session.user.name || "").replace(
      /\s/g,
      "-"
    )}-${nanoid()}`.toLowerCase();

    const rawData = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        username: initialUsername,
      },
    });
    const { json } = superjson.serialize(rawData);

    return {
      props: {
        profile: json,
      },
    };
  }

  const { json } = superjson.serialize(user);

  return {
    props: {
      profile: json,
    },
  };
};

export default Settings;
