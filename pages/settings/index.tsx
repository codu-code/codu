import type {
  NextPage,
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { customAlphabet } from "nanoid";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../app/api/auth/authOptions";
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
import { uploadFile } from "../../utils/s3helpers";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type ProfilePhoto = {
  status: "success" | "error" | "loading" | "idle";
  url: string;
};

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

  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto>({
    status: "idle",
    url: profile.image,
  });

  const { mutate } = trpc.profile.edit.useMutation({
    onError() {
      toast.error("Something went wrong saving settings.");
    },
    onSuccess() {
      router.push(`/${username}`);
    },
  });

  const { mutate: getUploadUrl } = trpc.profile.getUploadUrl.useMutation();
  const { mutate: updateUserPhotoUrl } =
    trpc.profile.updateProfilePhotoUrl.useMutation();

  const onSubmit: SubmitHandler<saveSettingsInput> = (values) => {
    mutate({ ...values, newsletter: weeklyNewsletter, emailNotifications });
  };

  const uploadToUrl = async (signedUrl: string, file: File) => {
    setProfilePhoto({ status: "loading", url: "" });

    if (!file) {
      setProfilePhoto({ status: "error", url: "" });
      toast.error("Invalid file upload.");
      return;
    }

    const response = await uploadFile(signedUrl, file);
    const { fileLocation } = response;
    await updateUserPhotoUrl({
      url: fileLocation,
    });

    return fileLocation;
  };

  const imageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const { size, type } = file;

      await getUploadUrl(
        { size, type },
        {
          onError(error) {
            if (error) return toast.error(error.message);
            return toast.error(
              "Something went wrong uploading the photo, please retry.",
            );
          },
          async onSuccess(signedUrl) {
            const url = await uploadToUrl(signedUrl, file);
            if (!url) {
              return toast.error(
                "Something went wrong uploading the photo, please retry.",
              );
            }
            setProfilePhoto({ status: "success", url });
            toast.success(
              "Profile photo successfully updated. This may take a few minutes to update around the site.",
            );
          },
        },
      );
    }
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
          <div className="bg-neutral-900 text-neutral-700 shadow-xl">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="border border-neutral-900"
            >
              {/* Profile section */}
              <div className="py-6 px-4 sm:p-6 lg:pb-8 ">
                <div>
                  <h2 className="text-3xl tracking-tight font-extrabold text-white">
                    Profile Settings
                  </h2>
                  <p className="mt-1 text-neutral-400">
                    This information will be displayed publicly so be careful
                    what you share.
                  </p>
                </div>

                <div>
                  <div>
                    <div className="mt-6 flex flex-col lg:flex-row">
                      <div className="flex-grow space-y-6">
                        <div>
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
                      </div>

                      {/* Photo upload */}

                      <div className="mt-6 flex-grow lg:mt-0 lg:ml-6 lg:flex-shrink-0 lg:flex-grow-0">
                        <p
                          className="text-sm font-medium text-white"
                          aria-hidden="true"
                        >
                          Photo{" "}
                        </p>
                        <div className="mt-1 lg:hidden">
                          <div className="flex items-center">
                            <div
                              className="relative flex-shrink-0 overflow-hidden rounded-full h-16 w-16 "
                              aria-hidden="true"
                            >
                              {profilePhoto.status === "error" ||
                              profilePhoto.status === "loading" ? (
                                <div className="rounded-full border-2 h-full w-full bg-black" />
                              ) : (
                                <img
                                  className="rounded-full border-2 border-white object-cover h-full w-full"
                                  src={`${
                                    profilePhoto.url
                                  }?t=${new Date().getTime()}`}
                                  alt="Profile photo upload section"
                                />
                              )}
                            </div>
                            <div className="ml-5 rounded-md shadow-sm">
                              <div className="group relative flex items-center justify-center border-white border-2 py-2 px-3 focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 hover:bg-black">
                                <label
                                  htmlFor="mobile-user-photo"
                                  className="relative text-sm font-medium leading-4 text-white"
                                >
                                  <span>Change</span>
                                  <span className="sr-only">user photo</span>
                                </label>
                                <input
                                  id="mobile-user-photo"
                                  name="user-photo"
                                  type="file"
                                  accept="image/png, image/gif, image/jpeg, image/webp"
                                  onChange={imageChange}
                                  className="absolute h-full w-full cursor-pointer rounded-md border-neutral-300 opacity-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative hidden overflow-hidden lg:block rounded-full h-32 w-32">
                          {profilePhoto.status === "error" ||
                          profilePhoto.status === "loading" ? (
                            <div className="rounded-full border-2 h-full w-full bg-black h-100 w-100" />
                          ) : (
                            <img
                              className="relative rounded-full border-2 border-white object-cover h-full w-full"
                              src={`${
                                profilePhoto.url
                              }?t=${new Date().getTime()}`}
                              alt="Profile photo upload section"
                              sizes="(max-width: 768px) 10vw"
                            />
                          )}
                          <label
                            htmlFor="desktop-user-photo"
                            className="absolute inset-0 flex h-full w-full items-center justify-center bg-black bg-opacity-75 text-sm font-medium text-white opacity-0 focus-within:opacity-100 hover:opacity-100"
                          >
                            <div className=" text-center text-xs">
                              Change Photo
                            </div>
                            <span className="sr-only"> user photo</span>
                            <input
                              type="file"
                              id="desktop-user-photo"
                              name="user-photo"
                              onChange={imageChange}
                              className="absolute inset-0 h-full w-full cursor-pointer rounded-md border-neutral-300 opacity-0"
                            />
                          </label>
                        </div>

                        {/* Photo end  */}
                      </div>
                      {/*  */}
                    </div>
                    <div className="mt-6">
                      <label htmlFor="bio">Short bio</label>
                      <div className="mt-1">
                        <textarea
                          {...register("bio")}
                          rows={2}
                          defaultValue={""}
                          maxLength={200}
                        />
                      </div>
                      <div className="mt-2 text-sm text-neutral-400 flex justify-between">
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
                  <div className="pt-6 divide-y divide-neutral-200">
                    <div>
                      <div>
                        <h2 className="text-xl tracking-tight font-bold text-white">
                          Privacy
                        </h2>
                        <p className="mt-1 text-sm text-neutral-400">
                          We respect your privacy, change your settings here.
                        </p>
                      </div>
                      <ul
                        role="list"
                        className="mt-2 divide-y divide-neutral-200"
                      >
                        <Switch.Group
                          as="li"
                          className="py-4 flex items-center justify-between"
                        >
                          <div className="flex flex-col items-center">
                            <Switch.Label as="p" className="sr-only" passive>
                              Email notifications
                            </Switch.Label>
                            <Switch.Description className="text-sm text-neutral-400">
                              Occasional email notifications from the platform.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={emailNotifications}
                            onChange={setEmailNotifications}
                            className={classNames(
                              emailNotifications
                                ? "bg-green-600"
                                : "bg-neutral-400",
                              "ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                emailNotifications
                                  ? "translate-x-5"
                                  : "translate-x-0",
                                "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200",
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
                            <Switch.Description className="text-sm text-neutral-400">
                              Opt-in to our weekly newsletter.
                            </Switch.Description>
                          </div>
                          <Switch
                            checked={weeklyNewsletter}
                            onChange={setWeeklyNewsletter}
                            className={classNames(
                              weeklyNewsletter
                                ? "bg-green-600"
                                : "bg-neutral-400",
                              "ml-4 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                weeklyNewsletter
                                  ? "translate-x-5"
                                  : "translate-x-0",
                                "inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200",
                              )}
                            />
                          </Switch>
                        </Switch.Group>
                      </ul>
                    </div>
                    <div className="mt-2 py-4 flex justify-end">
                      <button
                        type="button"
                        className="bg-white border border-neutral-300 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
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
  const session = await getServerSession(context.req, context.res, authOptions);

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
      "-",
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
