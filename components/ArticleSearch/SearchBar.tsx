interface Props {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar = (props: Props) => {
  const { searchTerm, setSearchTerm } = props;

  console.log(searchTerm);

  return (
    <div className="flex grow justify-end">
      <label htmlFor="searchInput" aria-label="Enter search term"></label>
      <input
        onChange={(e) => setSearchTerm(e.target.value)}
        type="text"
        value={searchTerm}
        placeholder="Search"
        id="searchInput"
        name="searchInput"
        className="max-w-56 w-56 max-[500px]:w-full sm:text-sm sm:leading-6 ml-2 mr-2 mt-2 block rounded-md border-0 p-1.5  ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-pink-600"
      />
    </div>
  );
};

export default SearchBar;
