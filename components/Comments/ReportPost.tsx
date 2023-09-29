import { useRef, useState,useEffect } from 'react';
import Flag from '../../icons/flag.svg'
import { XCircleIcon,XIcon } from "@heroicons/react/outline";


interface Props {
    name:string;
    body:string;
    id:number;
}

export const ReportPost = (props:Props) => {

  const { name, body, id } = props;

  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [comment, setComment] = useState('')

  console.log(comment )

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
        <dialog ref={modalRef} onKeyDown={handleKeyDown} className='border bg-neutral-900 text-neutral-400 max-w-lg rounded-lg backdrop:bg-gray-700/90' >
            <h1 className='text-2xl tracking-tight font-bold text-neutral-50 m-8 ml-4'>
                Submit a report
            </h1>

            <p className='border p-4 m-4 mr-2 bg-neutral-700'>{body}</p>
            
            <div className='m-4'>
                <p className='mb-2'>Is this comment inappropriate?</p>
                <p>Thank you for bringing this to our attention. We take reports very seriously and will thoroughly investigate the matter.</p>
            </div>

            <div className='m-4'>
                <label htmlFor='report-comment'>Comment</label>
                <textarea
                    maxLength={156}
                    id="report-comment"
                    rows={3}
                    placeholder='leave a comment'
                    onChange={(e)=>setComment(e.target.value)}
                    value={comment}
                />
            </div>
       

            <div className="flex justify-end mt-8 m-4 text-sm">
                <button className="primary-button"
                    onClick={handleCloseModal}>
                    SUBMIT REPORT
                </button>
            </div>

            <button onClick={handleCloseModal} className="absolute top-6 right-6 p-1 hover:bg-neutral-800 rounded-full">
                <XIcon className='w-8'/>
            </button>


        </dialog>
    }
    </>
  );
};


