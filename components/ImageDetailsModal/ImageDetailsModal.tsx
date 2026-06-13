import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import type { Editor } from "@tiptap/core";
import { Modal } from "@/components/Modal/Modal";
import { XIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Description, DialogTitle } from "@headlessui/react";

const imageDetailsSchema = z.object({
  src: z
    .string()
    .trim()
    .min(1, { message: "A URL is required." })
    .url({ message: "Must be a valid URL" }),
  alt: z
    .string()
    .refine((value) => value !== "", { message: "An alt value is required" }),
  title: z
    .string()
    .refine((value) => value !== "", { message: "A title is required" }),
});

type ImageDetailsSchema = z.infer<typeof imageDetailsSchema>;

interface Props {
  setIsImageDetailsModalOpen: Dispatch<SetStateAction<boolean>>;
  isImageDetailsModalOpen: boolean;
  editor?: Editor;
}

export default function ImageDetailsModal(props: Props) {
  const { isImageDetailsModalOpen, setIsImageDetailsModalOpen, editor } = props;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ImageDetailsSchema>({
    resolver: zodResolver(imageDetailsSchema),
  });

  const onSubmit = (data: ImageDetailsSchema) => {
    editor
      ?.chain()
      .focus()
      .setImage({ src: data.src, alt: data.alt, title: data.title })
      .run();

    reset();
    setIsImageDetailsModalOpen(false);
  };

  return (
    <Modal
      open={isImageDetailsModalOpen}
      onClose={() => {
        reset();
        setIsImageDetailsModalOpen(false);
      }}
    >
      <>
        <DialogTitle className="mb-4 text-center text-lg">
          Image details
        </DialogTitle>

        <Description className="mb-4">
          Please enter a URL for the image, along with an alt description and a
          title.
        </Description>
        <form>
          <div>
            <label htmlFor="src">Image URL:</label>
            <input
              {...register("src")}
              type="text"
              id="src"
              name="src"
              placeholder="Enter image URL..."
            />
            {errors && (
              <p className="mt-2 text-right text-red-600">
                {errors.src?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="alt">Alt Text:</label>
            <input
              {...register("alt")}
              type="text"
              id="alt"
              name="alt"
              placeholder="Enter an alt description..."
            />
            {errors && (
              <p className="mt-2 text-right text-red-600">
                {errors.alt?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title">Title:</label>
            <input
              {...register("title")}
              type="text"
              id="title"
              name="title"
              placeholder="Enter a title..."
            />
            {errors && (
              <p className="mt-2 text-right text-red-600">
                {errors.title?.message}
              </p>
            )}
          </div>

          <div className="mt-4 flex w-full justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-5 inline-flex justify-center rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent shadow-sm transition-colors hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
              onClick={handleSubmit(onSubmit)}
            >
              Submit
            </button>
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="bg-surface text-faint hover:text-muted focus:text-muted"
                onClick={() => {
                  setIsImageDetailsModalOpen(false);
                  reset();
                }}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
      </>
    </Modal>
  );
}
