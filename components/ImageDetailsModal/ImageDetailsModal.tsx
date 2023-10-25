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

interface Props {
  setIsImageDetailsModalOpen: Dispatch<SetStateAction<boolean>>;
  isImageDetailsModalOpen: boolean;
  editor?: Editor;
}

interface ImageDetails {
  src: string;
  alt: string;
  title: string;
}

export default function ImageDetailsModal(props: Props) {
  const { isImageDetailsModalOpen, setIsImageDetailsModalOpen, editor } = props;

  const [imgDetails, setImgDetails] = useState<ImageDetails>({
    src: "",
    alt: "",
    title: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setImgDetails({ ...imgDetails, [name]: value });
  };

  // console.log(imgDetails);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // const addImage = useCallback(() => {
    const url = imgDetails.src;
    const alt = imgDetails.alt;
    const title = imgDetails.title;

    if (url) {
      console.log(imgDetails);
      console.log(editor);
      editor
        ?.chain()
        .focus()
        .setImage({ src: url, alt: alt, title: title })
        .run();
    }

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

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="src">Image URL:</label>
            <input
              type="text"
              id="src"
              name="src"
              value={imgDetails.src}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="alt">Alt Text:</label>
            <input
              type="text"
              id="alt"
              name="alt"
              value={imgDetails.alt}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={imgDetails.title}
              onChange={handleChange}
            />
          </div>

          <button type="submit">Submit</button>
        </form>

        <div>this is the image modal</div>
      </>
    </Modal>
  );
}
