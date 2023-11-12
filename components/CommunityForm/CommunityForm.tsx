"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { upsertCommunitySchema } from "@/schema/community";
import type { upsertCommunityInput } from "@/schema/community";
import CustomTextareaAutosize from "../CustomTextareAutosize/CustomTextareaAutosize";
import { useRef, useState } from "react";
import { useMarkdownHotkeys } from "@/markdoc/editor/hotkeys/hotkeys.markdoc";
import { useMarkdownShortcuts } from "@/markdoc/editor/shortcuts/shortcuts.markdoc";
import { toast, Toaster } from "sonner";
import { trpc } from "@/utils/trpc";
import { uploadFile } from "@/utils/s3helpers";
import { useRouter } from "next/navigation";

interface Community {
  id?: string | null;
  name: string;
  city: string;
  country: string;
  coverImage: string;
  description: string;
  excerpt: string;
}

interface CommunityFormProps {
  defaultValues: Community;
}

type CoverImage = {
  status: "success" | "error" | "loading" | "idle";
  url: string;
};

export function CommunityForm(props: CommunityFormProps) {
  const { defaultValues } = props;
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useMarkdownHotkeys(textareaRef);
  useMarkdownShortcuts(textareaRef);
  const { mutate: getUploadUrl } = trpc.community.getUploadUrl.useMutation();

  const { register, handleSubmit, formState, setValue } =
    useForm<upsertCommunityInput>({
      resolver: zodResolver(upsertCommunitySchema),
      defaultValues,
      mode: "onChange",
    });

  const { mutate: upsert } = trpc.community.upsert.useMutation({
    onError() {
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Saved!");
      router.push("/communities");
    },
  });

  const onSubmit = function (data: Community) {
    upsert(data);
  };

  const [coverImage, setCoverImage] = useState<CoverImage>({
    status: "idle",
    url: props.defaultValues.coverImage,
  });

  const uploadToUrl = async (signedUrl: string, file: File) => {
    setCoverImage({ status: "loading", url: "" });

    if (!file) {
      setCoverImage({ status: "error", url: "" });
      toast.error("Invalid file upload.");
      return;
    }

    const response = await uploadFile(signedUrl, file);

    const { fileLocation } = response;
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
            setCoverImage({ status: "success", url });
            setValue("coverImage", url);
            toast.success(
              "Profile photo successfully updated. This may take a few minutes to update around the site.",
            );
          },
        },
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border border-neutral-900"
    >
      <Toaster />
      <div className="px-4 py-6 sm:p-6 lg:pb-8 ">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Community editor
          </h2>
        </div>
        <div>
          <div>
            <div className="mt-6 flex flex-col lg:flex-row">
              <div className="flex-grow space-y-6">
                <div>
                  <label htmlFor="name">Name</label>
                  <input type="text" {...register("name")} />
                  {formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {`${formState.errors.name.message || "Required"}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col lg:flex-row">
              <div className="flex-grow space-y-6">
                <div className="pr-4">
                  <label htmlFor="city">City</label>
                  <input type="text" {...register("city")} />
                  {formState.errors.city && (
                    <p className="mt-1 text-sm text-red-600">
                      {`${formState.errors.city.message || "Required"}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-grow space-y-6">
                <div>
                  <label htmlFor="country">Country</label>
                  <input type="text" {...register("country")} />
                  {formState.errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {`${formState.errors.country.message || "Required"}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <label htmlFor="excerpt">Short description</label>
              <div className="mt-1">
                <textarea
                  {...register("excerpt")}
                  rows={2}
                  defaultValue={""}
                  maxLength={200}
                />
                {formState.errors.excerpt && (
                  <p className="mt-1 text-sm text-red-600">
                    {`${formState.errors.excerpt.message || "Required"}`}
                  </p>
                )}
              </div>
            </div>
            {/* Photo upload */}

            <div className="mt-6 flex-grow">
              <p className="text-sm font-medium text-white" aria-hidden="true">
                Photo{" "}
              </p>
              <div className="mt-1 lg:hidden">
                <div className="flex items-center">
                  <div
                    className="aspect-[16/9]h-16 relative w-16 w-full flex-shrink-0 overflow-hidden rounded-lg object-cover "
                    aria-hidden="true"
                  >
                    {coverImage.status === "error" ||
                    coverImage.status === "loading" ? (
                      <div className="aspect-[16/9] h-full w-full w-full rounded-lg border-2 bg-black object-cover" />
                    ) : (
                      <img
                        className="aspect-[16/9] h-full w-full w-full rounded-lg border-2 border-white object-cover object-cover"
                        src={`${coverImage.url}`}
                        alt="Profile photo upload section"
                      />
                    )}
                  </div>
                  <div className="ml-5 rounded-md shadow-sm">
                    <div className="group relative flex items-center justify-center border-2 border-white px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 hover:bg-black">
                      <label
                        htmlFor="mobile-community-photo"
                        className="relative text-sm font-medium leading-4 text-white"
                      >
                        <span>Change</span>
                        <span className="sr-only">community photo</span>
                      </label>
                      <input
                        id="mobile-community-photo"
                        name="community-photo"
                        type="file"
                        accept="image/png, image/gif, image/jpeg, image/webp"
                        onChange={imageChange}
                        className="absolute h-full w-full cursor-pointer rounded-md border-neutral-300 opacity-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative hidden aspect-[16/9] w-full overflow-hidden rounded-lg object-cover lg:block">
                {coverImage.status === "error" ||
                coverImage.status === "loading" ? (
                  <div className="aspect-[16/9] h-full w-full w-full rounded-lg border-2 bg-black object-cover" />
                ) : (
                  <img
                    className="relative aspect-[16/9] w-full rounded-lg border-2 border-white object-cover object-cover"
                    src={coverImage.url}
                    alt="Profile photo upload section"
                    sizes="(max-width: 768px) 10vw"
                  />
                )}
                <label
                  htmlFor="desktop-community-photo"
                  className="absolute inset-0 flex h-full w-full items-center justify-center bg-black bg-opacity-75 text-sm font-medium text-white opacity-0 focus-within:opacity-100 hover:opacity-100"
                >
                  <div className=" text-center text-xs">Change Photo</div>
                  <span className="sr-only"> community photo</span>
                  <input
                    type="file"
                    id="desktop-community-photo"
                    name="community-photo"
                    onChange={imageChange}
                    className="absolute inset-0 h-full w-full cursor-pointer rounded-md border-neutral-300 opacity-0"
                  />
                </label>
              </div>
              {formState.errors.coverImage && (
                <p className="mt-1 text-sm text-red-600">
                  {`${formState.errors.coverImage.message || "Required"}`}
                </p>
              )}
            </div>

            {/* Photo end  */}
            <div className="mt-6">
              <label htmlFor="bio">About</label>
              <div className="mt-1">
                <CustomTextareaAutosize
                  placeholder="Explain what is your community about here 💖"
                  className="mb-8 border-none bg-neutral-900 text-lg shadow-none outline-none focus:bg-black"
                  minRows={25}
                  {...register("description")}
                  inputRef={textareaRef}
                />
                {formState.errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {`${formState.errors.description.message || "Required"}`}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="divide-y divide-neutral-200 pt-6">
            <div className="mt-2 flex justify-end py-4">
              <button
                type="button"
                className="inline-flex justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                onClick={() => router.push(`/`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ml-5 inline-flex w-20 justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
