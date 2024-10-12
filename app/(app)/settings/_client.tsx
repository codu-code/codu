"use client";

import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import type { saveSettingsInput } from "@/schema/profile";
import { saveSettingsSchema } from "@/schema/profile";

import { uploadFile } from "@/utils/s3helpers";
import type { user } from "@/server/db/schema";
import { Button } from "@/components/ui-components/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { Heading } from "@/components/ui-components/heading";
import { Avatar } from "@/components/ui-components/avatar";
import { Input } from "@/components/ui-components/input";
import {
  ErrorMessage,
  Field,
  Label,
} from "@/components/ui-components/fieldset";
import { Textarea } from "@/components/ui-components/textarea";
import { Switch } from "@/components/ui-components/switch";

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
  | "email"
  | "id"
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
    reset,
    formState: { errors },
  } = useForm<saveSettingsInput>({
    resolver: zodResolver(saveSettingsSchema),
    defaultValues: {
      ...profile,
      username: profile.username || "",
    },
  });

  const { emailNotifications: eNotifications, newsletter } = profile;

  const [emailNotifications, setEmailNotifications] = useState(eNotifications);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(newsletter);
  const [newEmail, setNewEmail] = useState("");
  const [sendForVerification, setSendForVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto>({
    status: "idle",
    url: profile.image,
  });

  const { mutate, isError, isSuccess, isLoading } =
    api.profile.edit.useMutation();
  const { mutate: getUploadUrl } = api.profile.getUploadUrl.useMutation();
  const { mutate: updateUserPhotoUrl } =
    api.profile.updateProfilePhotoUrl.useMutation();
  const { mutate: updateEmail } = api.profile.updateEmail.useMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Saved");
    }
    if (isError) {
      toast.error("Something went wrong saving settings.");
    }
  }, [isError, isSuccess]);

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

  const handleNewEmailUpdate = async () => {
    setLoading(true);
    await updateEmail(
      { newEmail },
      {
        onError(error) {
          setLoading(false);
          if (error) return toast.error(error.message);
          return toast.error(
            "Something went wrong sending the verification link.",
          );
        },
        onSuccess() {
          setLoading(false);
          toast.success("Verification link sent to your email.");
          setSendForVerification(true);
        },
      },
    );
  };

  return (
    <div className="old-input py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col justify-center px-4 sm:px-6 lg:col-span-9">
        <div className="text-neutral-700">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Profile section */}
            <div className="flex flex-col px-4 py-6 sm:p-6 lg:pb-8">
              <div>
                <div>
                  <Heading level={1}>Profile Information</Heading>
                </div>

                {/* Photo upload */}

                <div className="mt-6 flex flex-col lg:flex-row">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Profile picture</Label>
                      <div className="text-xs text-gray-500">
                        This will be displayed on your public profile
                      </div>
                    </div>

                    <div className="flex-start flex w-full flex-row">
                      <div className="h-16 w-16 lg:block">
                        <Avatar
                          square
                          src={
                            profilePhoto.status === "error" ||
                            profilePhoto.status === "loading"
                              ? undefined
                              : `${profilePhoto.url}`
                          }
                          alt="Profile photo upload section"
                          className="relative h-16 w-16 overflow-hidden rounded-lg"
                        />
                      </div>

                      <div className="ml-4 flex flex-col items-start justify-center">
                        <Button
                          color={"dark/white"}
                          type="button"
                          className="h-[30px] rounded-md text-xs"
                          onClick={() => {
                            fileInputRef.current?.click();
                          }}
                          aria-label="Change profile picture"
                        >
                          Change avatar
                        </Button>

                        <Input
                          type="file"
                          id="file-input"
                          name="user-photo"
                          accept="image/png, image/gif, image/jpeg"
                          onChange={imageChange}
                          className="hidden"
                          ref={fileInputRef}
                        />

                        <div className="mt-1 text-xs text-gray-500">
                          JPG, GIF or PNG. 1MB max.
                        </div>
                      </div>
                    </div>

                    {/* Input field */}
                  </Field>
                </div>

                <div className="mt-6 flex flex-col lg:flex-row">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Full Name</Label>
                      <div className="text-xs text-gray-500">
                        This will be displayed on your public profile
                      </div>
                    </div>

                    {/* Input field */}
                    <div className="flex w-full flex-col">
                      <Input
                        id="name"
                        type="text"
                        autoComplete="given-name"
                        className="mt-2 w-full"
                        {...register("name")}
                      />

                      {/* Error message */}
                      {errors?.name && (
                        <ErrorMessage className="mt-1 text-red-500">
                          {errors.name.message}
                        </ErrorMessage>
                      )}
                    </div>
                  </Field>
                </div>

                {/* User name */}
                <div className="mt-6">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Username</Label>
                      <div className="text-xs text-gray-500">
                        This will be how you share your profile
                      </div>
                    </div>

                    {/* Input field */}
                    <div className="flex w-full flex-col">
                      <Input
                        id="username"
                        type="text"
                        autoComplete="given-name"
                        className="mt-2 w-full"
                        {...register("username")}
                      />

                      {/* Error message */}
                      {errors?.username && (
                        <ErrorMessage className="mt-1 text-red-500">
                          {errors.username.message}
                        </ErrorMessage>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Short Bio */}
                <div className="mt-6">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Bio</Label>
                      <div className="pr-1 text-xs text-gray-500">
                        This will be displayed on your public profile. Maximum
                        200 characters.
                      </div>
                    </div>

                    {/* Text Area Field */}
                    <div className="flex w-full flex-col">
                      <Textarea
                        {...register("bio")}
                        id="bio"
                        rows={2}
                        defaultValue={""}
                        maxLength={200}
                        className="rounded-lg"
                      />

                      {/* Error message */}
                      {errors?.bio && (
                        <ErrorMessage className="mt-1 text-red-500">
                          {errors.bio.message}
                        </ErrorMessage>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Location */}
                <div className="mt-6">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Location</Label>
                      <div className="text-xs text-gray-500">
                        This is where you live
                      </div>
                    </div>

                    {/* Input field */}
                    <div className="flex w-full flex-col">
                      <Input
                        id="location"
                        type="text"
                        placeholder="The moon 🌙"
                        autoComplete="country-name"
                        className="mt-2 w-full"
                        {...register("location")}
                      />

                      {/* Error message */}
                      {errors?.location && (
                        <ErrorMessage className="mt-1 text-red-500">
                          {errors.location.message}
                        </ErrorMessage>
                      )}
                    </div>
                  </Field>
                </div>

                {/* Website URL */}
                <div className="mt-6">
                  <Field className="flex w-full flex-row">
                    {/* Container for Label and Subheading */}
                    <div className="flex w-full flex-col">
                      <Label>Website URL</Label>
                      <div className="text-xs text-gray-500">
                        A link to your website (optional)
                      </div>
                    </div>

                    {/* Input field */}
                    <div className="flex w-full flex-col">
                      <Input
                        id="websiteUrl"
                        type="text"
                        placeholder="https://codu.co/"
                        autoComplete="url"
                        className="mt-2 w-full"
                        {...register("websiteUrl")}
                      />

                      {/* Error message */}
                      {errors?.websiteUrl && (
                        <ErrorMessage className="mt-1 text-red-500">
                          {errors.websiteUrl.message}
                        </ErrorMessage>
                      )}
                    </div>
                  </Field>
                </div>
              </div>

              {/* Email Section */}
              <div className="pt-6">
                <Heading level={1}>Email Settings</Heading>
                <div className="mt-6">
                  <Field className="flex w-full flex-row">
                    <div className="flex w-full flex-col">
                      <Label>Current Email</Label>
                      <div className="text-xs text-gray-500">
                        This is where we will send all communications
                      </div>
                    </div>
                    <div className="flex w-full flex-col">
                      <Input
                        type="text"
                        className="mt-2 w-full"
                        value={profile.email || ""}
                        disabled
                      />
                    </div>
                  </Field>
                  <div className="mt-6">
                    <Field className="flex w-full flex-row">
                      <div className="flex w-full flex-col">
                        <Label>Update Email</Label>
                        <div className="text-xs text-gray-500">
                          You can alter your email by verifying a new email
                          address.
                        </div>
                      </div>
                      <div className="flex w-full flex-col">
                        <Input
                          type="email"
                          id="newEmail"
                          onChange={(e) => {
                            setNewEmail(e.target.value);
                            if (
                              e.target.value &&
                              !/\S+@\S+\.\S+/.test(e.target.value)
                            ) {
                              setEmailError(
                                "Please enter a valid email address",
                              );
                            } else {
                              setEmailError("");
                            }
                          }}
                          value={newEmail}
                          className="mt-2 w-full"
                        />
                        {emailError && (
                          <ErrorMessage className="mt-1 text-red-500">
                            {emailError}
                          </ErrorMessage>
                        )}
                      </div>
                    </Field>
                  </div>
                  <div className="mt-2 flex justify-end py-4">
                    {!sendForVerification ? (
                      <Button
                        color="pink"
                        disabled={
                          !newEmail || newEmail === profile.email || loading
                        }
                        onClick={handleNewEmailUpdate}
                      >
                        {loading && (
                          <Loader2 className="text-primary h-6 w-6 animate-spin" />
                        )}
                        Send Verification Email
                      </Button>
                    ) : (
                      <div className="mt-2 flex flex-row gap-2">
                        <h2 className="flex items-center gap-2 text-sm italic text-green-400">
                          <CheckCheck />
                          Verification link sent
                        </h2>
                        <Button
                          color="pink"
                          disabled={
                            !newEmail || newEmail === profile.email || loading
                          }
                          onClick={handleNewEmailUpdate}
                        >
                          {loading && (
                            <Loader2 className="text-primary h-6 w-6 animate-spin" />
                          )}
                          Resend Verification Email
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="pt-6">
                <div className="mt-6">
                  <Heading level={1}>Notifications</Heading>
                </div>
                <div>
                  <Field className="flex items-center justify-between py-4">
                    <Label passive className="flex flex-col text-sm">
                      <span className="block">
                        Allow notifications from the platform
                      </span>
                      <span className="text-xs text-gray-500">
                        Send an email when a user interacts with you on the
                        platform
                      </span>
                    </Label>
                    <Switch
                      color="green"
                      checked={emailNotifications}
                      onChange={setEmailNotifications}
                      className={classNames(
                        emailNotifications ? "bg-green-600" : "bg-neutral-400",
                      )}
                      aria-label="Allow notifications from the platform"
                    />
                  </Field>
                  <Field className="mt-2 flex items-center justify-between py-4">
                    <Label passive className="flex flex-col text-sm">
                      <span className="block">Weekly Newsletter</span>
                      <span className="text-xs text-gray-500">
                        Receive our weekly newsletter
                      </span>
                    </Label>
                    <Switch
                      color="green"
                      checked={weeklyNewsletter}
                      onChange={setWeeklyNewsletter}
                      className={classNames(
                        weeklyNewsletter ? "bg-green-600" : "bg-neutral-400",
                      )}
                      aria-label="Subscribe for weekly newsletter"
                    />
                  </Field>
                </div>
                <div className="mt-2 flex justify-end py-4">
                  <Button
                    color="dark/white"
                    className="rounded-md"
                    onClick={() => reset()}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="pink"
                    className="ml-5 rounded-md"
                    disabled={isLoading}
                    type="submit"
                  >
                    Save Changes
                  </Button>
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
