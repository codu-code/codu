"use client";

import { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import type { saveSettingsInput } from "@/schema/profile";
import { saveSettingsSchema } from "@/schema/profile";

import { uploadFile } from "@/utils/s3helpers";
import type { user } from "@/server/db/schema";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type User = Pick<
  typeof user.$inferSelect,
  | "name"
  | "username"
  | "bio"
  | "location"
  | "websiteUrl"
  | "emailNotifications"
  | "newsletter"
  | "image"
>;

type ProfilePhoto = {
  status: "success" | "error" | "loading" | "idle";
  url: string;
};

const Settings = ({ profile }: { profile: User }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<saveSettingsInput>({
    resolver: zodResolver(saveSettingsSchema),
    defaultValues: { ...profile, username: profile.username || "" },
  });

  const bio = watch("bio");
  const username = watch("username");

  const { emailNotifications: eNotifications, newsletter } = profile;

  const [emailNotifications, setEmailNotifications] = useState(eNotifications);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(newsletter);

  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto>({
    status: "idle",
    url: profile.image,
  });

  const { mutate, isError, isSuccess, isLoading } =
    api.profile.edit.useMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Saved");
    }
    if (isError) {
      toast.error("Something went wrong saving settings.");
    }
  }, [isError, isSuccess]);

  const { mutate: getUploadUrl } = api.profile.getUploadUrl.useMutation();
  const { mutate: updateUserPhotoUrl } =
    api.profile.updateProfilePhotoUrl.useMutation();

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
        { size, type, config: { kind: "uploads", userId: "me" } },
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
    <div className="py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col justify-center px-4 sm:px-6 lg:col-span-9">
        <div className="text-neutral-700">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Profile section */}
            <div className="px-4 py-6 sm:p-6 lg:pb-8 ">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
                  Profile Settings
                </h2>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  This information will be displayed publicly so be careful what
                  you share.
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
                          id="name"
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
                        <div className="mt-1 flex shadow-sm">
                          <span className="mt-1  flex items-center bg-neutral-800 px-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
                            codu.co/
                          </span>
                          <input
                            type="text"
                            {...register("username")}
                            id="username"
                            autoComplete="username"
                          />
                        </div>
                        {errors.username && (
                          <p className="mt-1 text-sm text-red-600">
                            {`${errors.username.message || "Required"}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Photo upload */}

                    <div className="mt-6 flex-grow lg:ml-6 lg:mt-0 lg:flex-shrink-0 lg:flex-grow-0">
                      <p
                        className="text-sm font-medium text-white"
                        aria-hidden="true"
                      >
                        Photo{" "}
                      </p>
                      <div className="mt-1 lg:hidden">
                        <div className="flex items-center">
                          <div
                            className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full "
                            aria-hidden="true"
                          >
                            {profilePhoto.status === "error" ||
                            profilePhoto.status === "loading" ? (
                              <div className="h-full w-full rounded-full border-2 bg-black" />
                            ) : (
                              // TODO: review this
                              // eslint-disable-next-line jsx-a11y/img-redundant-alt
                              <img
                                className="h-full w-full rounded-full border-2 border-white object-cover"
                                src={`${
                                  profilePhoto.url
                                }?t=${new Date().getTime()}`}
                                alt="Profile photo upload section"
                              />
                            )}
                          </div>
                          <div className="ml-5 rounded-md shadow-sm">
                            <div className="group relative flex items-center justify-center border-2 border-white px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 hover:bg-black">
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

                      <div className="relative hidden h-32 w-32 overflow-hidden rounded-full lg:block">
                        {profilePhoto.status === "error" ||
                        profilePhoto.status === "loading" ? (
                          <div className="h-100 w-100 h-full w-full rounded-full border-2 bg-black" />
                        ) : (
                          // TODO: review this
                          // eslint-disable-next-line jsx-a11y/img-redundant-alt
                          <img
                            className="relative h-full w-full rounded-full border-2 border-white object-cover"
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
                        id="bio"
                        rows={2}
                        defaultValue={""}
                        maxLength={200}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
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
                        id="location"
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
                        id="websiteUrl"
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
                <div className="divide-y divide-neutral-200 pt-6">
                  <div>
                    <div className="text-neutral-600 dark:text-neutral-400">
                      <h2
                        id="privacy-heading"
                        className="text-xl font-bold tracking-tight text-neutral-800 dark:text-white"
                      >
                        Email Notifications
                      </h2>
                      <p className="mt-1 text-sm">
                        Change your notification settings here.
                      </p>
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
                    <ul
                      role="list"
                      aria-labelledby="privacy-heading"
                      className="mt-2 divide-y divide-neutral-200"
                    >
                      <Switch.Group
                        as="li"
                        className="flex items-center justify-between py-4"
                      >
                        <div className="flex flex-col items-center">
                          <Switch.Label as="p" className="sr-only" passive>
                            Email notifications
                          </Switch.Label>
                          <Switch.Description className="text-sm text-neutral-600 dark:text-neutral-400">
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
                            "relative ml-4 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              emailNotifications
                                ? "translate-x-5"
                                : "translate-x-0",
                              "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            )}
                          />
                        </Switch>
                      </Switch.Group>
                      <Switch.Group
                        as="li"
                        className="mt-2 flex items-center justify-between py-4"
                      >
                        <div className="flex flex-col">
                          <Switch.Label as="p" className="sr-only" passive>
                            Weekly newsletter
                          </Switch.Label>
                          <Switch.Description className="text-sm text-neutral-600 dark:text-neutral-400">
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
                            "relative ml-4 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              weeklyNewsletter
                                ? "translate-x-5"
                                : "translate-x-0",
                              "inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            )}
                          />
                        </Switch>
                      </Switch.Group>
                    </ul>
                  </div>
                  <div className="mt-2 flex justify-end py-4">
                    <button
                      type="button"
                      className="inline-flex justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isLoading}
                      type="submit"
                      className="ml-5 inline-flex w-20 justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 disabled:opacity-20"
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
  );
};

export default Settings;
