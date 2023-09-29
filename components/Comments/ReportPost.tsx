import { useRef, useState,useEffect } from 'react';
import Flag from '../../icons/flag.svg'


interface Props {
    name:string;
    body:string;
    id:number;
}

export const ReportPost = (props:Props) => {

  const { name, body, id } = props;

  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);
   
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
        handleCloseModal();
    }
  };

const modalRef = useRef<HTMLDialogElement | null>(null);
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (isModalOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isModalOpen]);

  return (
    <>
        <button 
            className="mr-4 flex p-1.5 rounded-full hover:bg-neutral-800"
            onClick={handleOpenModal}>
            <Flag className="h-5 "/>
        </button>   


    {isModalOpen && 
        <dialog ref={modalRef} onKeyDown={handleKeyDown}>
            <div>      
                Is this comment inappropriate? 
                Thank you for bringing this to our attention. We take reports very seriously and will thoroughly investigate the matter.
            </div>

            <button  onClick={handleCloseModal}>
                Close
            </button>

        </dialog>
    }

    </>
  );
};
