"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui-components/avatar";
import { Input } from "@/components/ui-components/input";
import { ErrorMessage } from "@/components/ui-components/fieldset";
import { Textarea } from "@/components/ui-components/textarea";
import { ReferralCard, Tag } from "@/components/ds";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

/** Mint switch — rounded-full track, knob slides left→right when on. */
const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void; // eslint-disable-line no-unused-vars
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative h-[23px] w-10 shrink-0 rounded-full transition-colors ${
      checked ? "bg-accent" : "bg-elevated"
    }`}
  >
    <span
      className={`absolute top-[3px] h-[17px] w-[17px] rounded-full transition-all ${
        checked ? "left-5 bg-on-accent" : "left-[3px] bg-faint"
      }`}
    />
  </button>
);

/** A labelled settings row: title + description on the left, control on the right. */
const SettingsRow = ({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-4 border-b border-hairline py-4 last:border-b-0">
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold text-fg">{title}</div>
      {desc && (
        <div className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</div>
      )}
    </div>
    {children}
  </div>
);

/** A stacked field block: label + description above the input. */
const FieldBlock = ({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <div className="border-b border-hairline py-4 last:border-b-0">
    <div className="text-sm font-semibold text-fg">{title}</div>
    {desc && (
      <div className="mb-2 mt-0.5 text-xs leading-relaxed text-muted">
        {desc}
      </div>
    )}
    <div className={desc ? "" : "mt-2"}>{children}</div>
  </div>
);

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
  status: "pending" | "error" | "success" | "idle";
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const TABS = ["Profile", "Notifications", "Account"] as const;
  type Tab = (typeof TABS)[number];

  // URL is the source of truth: ?tab=profile|notifications|account (lower-case).
  const tabParam = searchParams?.get("tab")?.toLowerCase();
  const tab: Tab =
    tabParam === "notifications"
      ? "Notifications"
      : tabParam === "account"
        ? "Account"
        : "Profile";

  const setTab = (value: Tab) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", value.toLowerCase());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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

  const { openTopics } = useShellActions();
  const { data: interestsData } = api.profile.myInterests.useQuery();
  const myTopics = interestsData?.topics ?? [];

  const { mutate, isError, isSuccess } = api.profile.edit.useMutation();
  const { mutate: getUploadUrl } = api.profile.getUploadUrl.useMutation();
  const { mutate: updateUserPhotoUrl } =
    api.profile.updateProfilePhotoUrl.useMutation();
  const { mutate: updateEmail } = api.profile.updateEmail.useMutation();

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

  const uploadToUrl = async (signedUrl: string, file: File) => {
    setProfilePhoto({ status: "pending", url: "" });

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
      className="mx-auto max-w-[620px] p-3 pt-8 sm:px-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <p className="eyebrow">
          <span className="slash">{"// "}</span>your account
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
          Settings
        </h1>
      </div>

      <div className="mb-2 mt-8 flex gap-5 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2 pt-1 text-sm transition-colors ${
              t === tab
                ? "border-accent font-semibold text-fg"
                : "border-transparent font-medium text-muted hover:text-fg"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* profile */}
      <div className={tab === "Profile" ? "" : "hidden"}>
      <div className="flex items-center gap-4 border-b border-hairline py-4">
        <Avatar
          square
          src={
            profilePhoto.status === "error" || profilePhoto.status === "pending"
              ? undefined
              : `${profilePhoto.url}`
          }
          alt="Profile photo upload section"
          className="h-16 w-16 shrink-0 overflow-hidden rounded-full"
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
          <p className="mt-1 text-xs text-faint">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>

      <FieldBlock
        title="Full name"
        desc="This will be displayed on your public profile"
      >
        <Input
          id="name"
          type="text"
          autoComplete="given-name"
          invalid={!!errors?.name}
          {...register("name")}
        />
        {errors?.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
      </FieldBlock>

      <FieldBlock
        title="Username"
        desc="This will be how you share your profile"
      >
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
      </FieldBlock>

      <FieldBlock
        title="Bio"
        desc="This will be displayed on your public profile. Maximum 200 characters."
      >
        <Textarea
          id="bio"
          rows={3}
          maxLength={200}
          invalid={!!errors?.bio}
          {...register("bio")}
        />
        {errors?.bio && <ErrorMessage>{errors.bio.message}</ErrorMessage>}
      </FieldBlock>

      <FieldBlock title="Location" desc="This is where you live">
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
      </FieldBlock>

      <FieldBlock
        title="Website URL"
        desc="A link to your website (optional)"
      >
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
      </FieldBlock>

      <FieldBlock
        title="Topics"
        desc="The topics you follow shape your feed. Edit them anytime."
      >
        <div className="flex flex-wrap items-center gap-2">
          {myTopics.length > 0 ? (
            myTopics.map((t) => <Tag key={t}>{t}</Tag>)
          ) : (
            <p className="text-sm text-muted">
              You haven&apos;t chosen any topics yet.
            </p>
          )}
        </div>
        <Button
          color="dark/white"
          type="button"
          className="mt-3 h-[30px] rounded-md text-xs"
          onClick={openTopics}
        >
          Edit topics
        </Button>
      </FieldBlock>

      <FieldBlock
        title="Invite friends"
        desc="Share Codú and earn points + the Connector badge for every builder who joins."
      >
        <ReferralCard />
      </FieldBlock>
      </div>

      {/* notifications */}
      <div className={tab === "Notifications" ? "" : "hidden"}>
      <SettingsRow
        title="Allow notifications from the platform"
        desc="Send an email when a user interacts with you on the platform"
      >
        <Toggle
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
      </SettingsRow>

      <SettingsRow
        title="Weekly Newsletter"
        desc="Receive our weekly newsletter"
      >
        <Toggle checked={weeklyNewsletter} onChange={setWeeklyNewsletter} />
      </SettingsRow>
      </div>

      {/* account */}
      <div className={tab === "Account" ? "" : "hidden"}>
      <FieldBlock
        title="Current email"
        desc="This is where we will send all communications"
      >
        <Input type="text" value={profile.email || ""} disabled />
      </FieldBlock>

      <FieldBlock
        title="Update email"
        desc="You can alter your email by verifying a new email address."
      >
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
            color="accent"
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
      </FieldBlock>

      <div className="flex items-center gap-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-danger">
            Delete account
          </div>
          <div className="mt-0.5 text-xs leading-relaxed text-muted">
            Permanently remove your account and data. Contact us to start.
          </div>
        </div>
        <a
          href="mailto:hi@codu.co?subject=Delete%20my%20account"
          className="rounded-md border border-hairline px-4 py-2 text-sm text-danger transition-colors hover:border-danger"
        >
          Delete account
        </a>
      </div>
      </div>

      {/* ---------- actions (sticky save bar) ---------- */}
      <div className="sticky bottom-0 mt-8 flex justify-end gap-4 border-t border-hairline bg-gradient-to-t from-canvas via-canvas py-4">
        <Button color="dark/white" onClick={() => reset()}>
          Reset
        </Button>
        <Button color="accent" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};

export default Settings;
