import React, { useRef, useState,useEffect } from 'react';
import Flag from '../../icons/flag.svg'
import { XIcon } from "@heroicons/react/outline";
import toast from "react-hot-toast";
import { signIn, useSession } from 'next-auth/react';
import sendEmail from '../../utils/sendEmail';
import { createReportEmailTemplate } from '../../utils/createReportEmailTemplate';

interface Props {
    name:string;
    body:string;
    id:number;
    email:string | null;
    slug:string
}

export const ReportPost = (props:Props) => {

  const { data:session } = useSession(); 
  const { name, body, id, email, slug } = props;
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [comment, setComment] = useState('')

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);   
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
        handleCloseModal();
    }
  };

  const handleSubmit = (e:React.FormEvent) =>{
    e.preventDefault();

    const reportDetails = {
        reportedById:session?.user?.id,
        reportedByEmail:session?.user?.email,
        reportedByUser:session?.user?.name,
        reportedOnName:name,
        reportedOnEmail:email,
        reportedComment:body,
        commentMadeByReporter:comment,
        commentId:id,
        timeReportSent:new Date(),
        postLink:`https://codu.co/articles/${slug}`
    }
    
    const htmlMessage = createReportEmailTemplate(reportDetails);

    try {
      sendEmail({
        recipient: process.env.ADMIN_EMAIL,
        htmlMessage,
        subject: "A user has reported a comment on Codú.co",
      }
      ).then(()=>
        toast.success("Report sent")
      )
    } catch (error) {
      console.log("Error attempting to email report", error);
      toast.error('Oops, something went wrong, please send us a message on discord https://github.com/codu-code/codu')
    } 

    handleCloseModal();
    setComment('')
  }
 
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

    // Close modal if clicked outside
    const checkIfClickedOutside = (e:MouseEvent) => {
      const targetNode = e.target as Node | null;
      if (isModalOpen && modalRef.current && targetNode?.nodeName==='DIALOG' ) setModalOpen(false)      
    }
    document.addEventListener("mousedown", checkIfClickedOutside)
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside)
    }
  }, [isModalOpen])


  return (
    <>
      <button aria-label="flag comment" onClick={()=> session ? handleOpenModal() : signIn() } className="mr-4 flex p-1.5 rounded-full hover:bg-neutral-800">
          <Flag className="h-5 "/>
      </button>   

    {isModalOpen &&    
        <dialog aria-modal="true" ref={modalRef} onKeyDown={handleKeyDown} 
                className='p-0 border bg-neutral-900 text-neutral-400 max-w-lg rounded-lg backdrop:bg-gray-700/90' >
            <div className= 'p-2 w-full h-full'>
                <h1 className='text-2xl tracking-tight font-bold text-neutral-50 m-8 ml-4'>
                    Submit a report
                </h1>
                <p className='border p-4 m-4 bg-neutral-700 text-zinc-200'>{body}</p>  
                <div className='m-4'>
                    <p className='mb-2'>Is this comment inappropriate?</p>
                    <p>Thank you for bringing it to our attention. We take reports very seriously and will thoroughly investigate the matter.</p>
                </div>

                <form className='m-4'>
                    <label htmlFor='report-comment'>Comment</label>
                    <textarea
                        maxLength={300}
                        id="report-comment"
                        rows={3}
                        placeholder='leave a comment'
                        onChange={(e)=>setComment(e.target.value)}
                        value={comment}
                    />

                    <div className="flex justify-end mt-8 m-4 text-sm">
                        <button className="primary-button" type='submit' onClick={handleSubmit}>
                            SUBMIT REPORT
                        </button>
                    </div>
                </form>

                <button onClick={handleCloseModal} aria-label="Close" className="absolute top-6 right-6 p-1 hover:bg-neutral-800 rounded-full">
                    <XIcon className='w-8'/>
                </button>
            </div>
        </dialog>
    }
    </>
  );
};



