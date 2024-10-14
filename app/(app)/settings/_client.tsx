"use client";

import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import type { saveSettingsInput } from "@/schema/profile";
import { saveSettingsSchema } from "@/schema/profile";

import type { user } from "@/server/db/schema";
import { Button } from "@/components/ui-components/button";
import { Loader2 } from "lucide-react";
import { Subheading, Heading } from "@/components/ui-components/heading";
import { Avatar } from "@/components/ui-components/avatar";
import { Input } from "@/components/ui-components/input";
import {
  ErrorMessage,
  Field,
  Label,
} from "@/components/ui-components/fieldset";
import { Textarea } from "@/components/ui-components/textarea";
import { Switch } from "@/components/ui-components/switch";
import { Divider } from "@/components/ui-components/divider";
import { Text } from "@/components/ui-components/text";
import { uploadToUrl } from "@/utils/fileUpload";

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
    reset,
    formState: { errors, isSubmitting },
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
  const [cooldown, setCooldown] = useState(0);

  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto>({
    status: "idle",
    url: profile.image,
  });

  const { mutate, isError, isSuccess } = api.profile.edit.useMutation();
  const { mutateAsync: getUploadUrl } = api.profile.getUploadUrl.useMutation();
  const { mutateAsync: updateUserPhotoUrl } =
    api.profile.updateProfilePhotoUrl.useMutation();
  const { mutateAsync: updateEmail } = api.profile.updateEmail.useMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Saved");
    }
    if (isError) {
      toast.error("Something went wrong saving settings.");
    }
  }, [isError, isSuccess]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onSubmit: SubmitHandler<saveSettingsInput> = (values) => {
    mutate({ ...values, newsletter: weeklyNewsletter, emailNotifications });
  };

  const imageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const { size, type } = file;

      setProfilePhoto({ status: "loading", url: "" });

      await getUploadUrl(
        { size, type },
        {
          onError(error) {
            toast.error(
              error.message ||
                "Something went wrong uploading the photo, please retry.",
            );
            setProfilePhoto({ status: "error", url: "" });
          },
          async onSuccess(signedUrl) {
            const { status, fileLocation } = await uploadToUrl({
              signedUrl,
              file,
              updateUserPhotoUrl,
            });

            if (status === "success" && fileLocation) {
              setProfilePhoto({ status: "success", url: fileLocation });
            } else {
              setProfilePhoto({ status: "error", url: "" });
            }
          },
        },
      );
    }
  };

  const handleNewEmailUpdate = async () => {
    if (cooldown > 0) {
      return;
    }

    if (!isValidEmail(newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

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
          setCooldown(120); // Set a 2 minute cooldown
          setEmailError(""); // Clear any existing error
        },
      },
    );
  };

  return (
    <form
      className="mx-auto max-w-4xl p-3 pt-8 sm:px-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Heading level={1}>Your Settings</Heading>
      <Divider className="my-10 mt-6" />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Profile Picture</Subheading>
          <Text>This will be displayed on your public profile</Text>
        </div>
        <Field>
          <div className="flex items-center space-x-4">
            <Avatar
              square
              src={
                profilePhoto.status === "error" ||
                profilePhoto.status === "loading"
                  ? undefined
                  : `${profilePhoto.url}`
              }
              alt="Profile photo upload section"
              className="h-16 w-16 overflow-hidden rounded-full"
            />
            <div>
              <Button
                color="dark/white"
                type="button"
                className="h-[30px] rounded-md text-xs"
                onClick={() => fileInputRef.current?.click()}
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
              <Text className="mt-1 text-xs text-gray-500">
                JPG, GIF or PNG. 1MB max.
              </Text>
            </div>
          </div>
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Full Name</Subheading>
          <Text>This will be displayed on your public profile</Text>
        </div>
        <Field>
          <Input
            id="name"
            type="text"
            autoComplete="given-name"
            invalid={!!errors?.name}
            {...register("name")}
          />
          {errors?.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Username</Subheading>
          <Text>This will be how you share your profile</Text>
        </div>
        <Field>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            invalid={!!errors?.username}
            {...register("username")}
          />
          {errors?.username && (
            <ErrorMessage>{errors.username.message}</ErrorMessage>
          )}
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Bio</Subheading>
          <Text>
            This will be displayed on your public profile. Maximum 200
            characters.
          </Text>
        </div>
        <Field>
          <Textarea
            id="bio"
            rows={3}
            maxLength={200}
            invalid={!!errors?.bio}
            {...register("bio")}
          />
          {errors?.bio && <ErrorMessage>{errors.bio.message}</ErrorMessage>}
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Location</Subheading>
          <Text>This is where you live</Text>
        </div>
        <Field>
          <Input
            id="location"
            type="text"
            placeholder="The moon 🌙"
            autoComplete="country-name"
            invalid={!!errors?.location}
            {...register("location")}
          />
          {errors?.location && (
            <ErrorMessage>{errors.location.message}</ErrorMessage>
          )}
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={2}>Website URL</Subheading>
          <Text>A link to your website (optional)</Text>
        </div>
        <Field>
          <Input
            id="websiteUrl"
            type="text"
            placeholder="https://example.com"
            autoComplete="url"
            invalid={!!errors?.websiteUrl}
            {...register("websiteUrl")}
          />
          {errors?.websiteUrl && (
            <ErrorMessage>{errors.websiteUrl.message}</ErrorMessage>
          )}
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={3}>Current Email</Subheading>
          <Text>This is where we will send all communications</Text>
        </div>
        <Field>
          <Input type="text" value={profile.email || ""} disabled />
        </Field>
      </section>

      <section className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Subheading level={3}>Update Email</Subheading>
          <Text>
            You can alter your email by verifying a new email address.
          </Text>
        </div>
        <Field>
          <Input
            type="email"
            id="newEmail"
            onChange={(e) => {
              setNewEmail(e.target.value);
              if (sendForVerification) {
                setEmailError(""); // Clear error when user starts typing again
              }
            }}
            value={newEmail}
          />
          {emailError && sendForVerification && (
            <ErrorMessage>{emailError}</ErrorMessage>
          )}
          <div className="mt-2 flex justify-end">
            <Button
              color="pink"
              disabled={
                !isValidEmail(newEmail) ||
                newEmail === profile.email ||
                loading ||
                cooldown > 0
              }
              onClick={handleNewEmailUpdate}
            >
              {loading && (
                <Loader2 className="text-primary h-6 w-6 animate-spin" />
              )}
              {cooldown > 0 ? `Wait ${cooldown}s` : "Send Verification Email"}
            </Button>
          </div>
        </Field>
      </section>

      <Divider className="my-10" soft />

      <section className="mt-6 space-y-4">
        <Field className="flex items-center justify-between">
          <Label passive className="flex flex-col">
            <span>Allow notifications from the platform</span>
            <Text className="text-xs text-gray-500">
              Send an email when a user interacts with you on the platform
            </Text>
          </Label>

          <Switch
            color="pink"
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
        </Field>

        <Field className="flex items-center justify-between">
          <Label passive className="flex flex-col">
            <span>Weekly Newsletter</span>
            <Text className="text-xs text-gray-500">
              Receive our weekly newsletter
            </Text>
          </Label>

          <Switch
            color="pink"
            checked={weeklyNewsletter}
            onChange={setWeeklyNewsletter}
          />
        </Field>
      </section>

      <Divider className="my-10" soft />

      <div className="flex justify-end space-x-4">
        <Button color="dark/white" onClick={() => reset()}>
          Reset
        </Button>
        <Button color="pink" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default Settings;
