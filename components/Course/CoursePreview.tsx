interface Props {
  name: string;
  description: string;
  thumbnail: string;
}

const CoursePreview = ({ name, description, thumbnail }: Props) => {
  return (
    <div className="bg-neutral-800 flex">
      <div className="">
        <h2 className="font-bold text-lg px-6 py-1 border-neutral-500 border-b">{name}</h2>
        <div className="px-6 py-3" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
      <img alt={name} src={thumbnail} />
    </div>
  )
}

export default CoursePreview
