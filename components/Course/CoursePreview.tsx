interface Props {
  name: string;
  description: string;
  thumbnail: string;
}

const CoursePreview = ({ name, description, thumbnail }: Props) => {
  return (
    <div className="bg-neutral-800 flex flex-col md:flex-row">
      <img alt={name} src={thumbnail} className="order-1 md:order-2" />
      <div className="order-2 md:order-1">
        <h2 className="font-bold text-lg px-3 py-2 lg:px-6 lg:py-1 border-neutral-500 border-b">{name}</h2>
        <div className="px-3 py-3 lg:px-6" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
    </div>
  )
}

export default CoursePreview
