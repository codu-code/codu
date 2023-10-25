import { Editor } from "@tiptap/core";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { Modal } from "@/components/Modal/Modal";
import { XIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const imageDetailsSchema = z.object({
  src: z
    .string({
      required_error: "A URL is required",
      invalid_type_error: "Must be a valid URL",
    })
    .trim()
    .url(),
  alt: z.string({ required_error: "An alt description is required" }),
  title: z.string({ required_error: "A title is required" }),
});

interface Props {
  setIsImageDetailsModalOpen: Dispatch<SetStateAction<boolean>>;
  isImageDetailsModalOpen: boolean;
  editor?: Editor;
}

// interface ImageDetails {
//   src: string;
//   alt: string;
//   title: string;
// }

export default function ImageDetailsModal(props: Props) {
  const { isImageDetailsModalOpen, setIsImageDetailsModalOpen, editor } = props;

  // const [imgDetails, setImgDetails] = useState<ImageDetails>({
  //   src: "",
  //   alt: "",
  //   title: "",
  // });

  // const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setImgDetails({ ...imgDetails, [name]: value });
  // };

  // const handleSubmitold = (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   // const addImage = useCallback(() => {
  //   const url = imgDetails.src;
  //   const alt = imgDetails.alt;
  //   const title = imgDetails.title;

  //   console.log("all3", url, alt, title);

  //   if (url) {
  //     console.log(imgDetails);
  //     console.log(editor);
  //     editor
  //       ?.chain()
  //       .focus()
  //       .setImage({ src: url, alt: alt, title: title })
  //       .run();
  //   }

  //   setIsImageDetailsModalOpen(false);
  // };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(imageDetailsSchema),
  });

  return (
    <Modal
      open={isImageDetailsModalOpen}
      onClose={() => setIsImageDetailsModalOpen(false)}
    >
      <>
        <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
          <button
            type="button"
            className="bg-neutral-900 text-neutral-400 hover:text-neutral-500 focus:outline-none"
            onClick={() => setIsImageDetailsModalOpen(false)}
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <form>
          <div>
            <label htmlFor="src">Image URL:</label>
            <input
              {...register("src")}
              type="url "
              id="src"
              name="src"
              placeholder="Enter image URL..."
            />
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
          </div>

          <button type="submit">Submit</button>
        </form>
      </>
    </Modal>
  );
}
