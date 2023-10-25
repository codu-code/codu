import { Editor } from "@tiptap/core";
import {
  BaseSyntheticEvent,
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useState,
} from "react";
import { Modal } from "@/components/Modal/Modal";
import { XIcon } from "lucide-react";
import { FieldValues, useForm } from "react-hook-form";
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

type ImageDetailsSchema = z.infer<typeof imageDetailsSchema>;

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
  } = useForm<ImageDetailsSchema>({
    resolver: zodResolver(imageDetailsSchema),
  });

  type Submit = {
    data: ImageDetailsSchema;
    event: BaseSyntheticEvent<object, any, any> | undefined;
  };

  const onSubmit = ({ data, event }: Submit) => {
    event?.stopPropagation();

    console.log(data.src);
    console.log(data.alt);
    console.log(data.title);

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

        <form
          onSubmit={handleSubmit((data, event) => onSubmit({ data, event }))}
        >
          <div>
            <label htmlFor="src">Image URL:</label>
            <input
              {...register("src")}
              type="url "
              id="src"
              name="src"
              placeholder="Enter image URL..."
            />
            {errors && <p>{errors.src?.message}</p>}
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
            {errors && <p>{errors.alt?.message}</p>}
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
            {errors && <p>{errors.title?.message}</p>}
          </div>

          <button type="submit">Submit</button>
        </form>
      </>
    </Modal>
  );
}
