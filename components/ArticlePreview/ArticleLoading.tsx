const ArticleLoading = () => (
  <div className="border-white border-2 shadow p-4 w-full my-4">
    <div className="animate-pulse">
      <div className="flex space-x-4">
        <div className="rounded-full bg-gray-800 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="grid grid-cols-8 gap-2">
            <div className="h-2 bg-gray-800 rounded col-span-2"></div>
            <div className="col-span-4" />
            <div className="h-2 bg-gray-800 rounded col-span-3"></div>
          </div>
        </div>
      </div>
      <div className="grid gap-x-4 grid-cols-12 space-y-2 my-4">
        <div className="h-5 col-span-8 bg-gray-800 rounded mb-4"></div>
        <div className="h-2 col-span-12 bg-gray-800 rounded"></div>
        <div className="h-2 col-span-6 bg-gray-800 rounded"></div>
        <div className="h-2 col-span-6 bg-gray-800 rounded"></div>
        <div className="h-2 col-span-12 bg-gray-800 rounded"></div>
      </div>
      <div className="h-5 col-span-5 bg-gray-800 rounded mt-6 w-40"></div>
    </div>
  </div>
);

export default ArticleLoading;
