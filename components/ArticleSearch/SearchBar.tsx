
interface Props {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar = (props: Props) => {
  const { searchTerm, setSearchTerm } = props;

  return (
    <div>
      <label htmlFor="searchInput" aria-label="Enter search term"></label>
      <input
        onChange={(e) => setSearchTerm(e.target.value)}
        type="text"
        value={searchTerm}
        placeholder="Search articles"
        id="searchInput"
        name="searchInput"
        className=" sm:text-sm sm:leading-6 h-8    
        rounded-md border-0 py-1.5 pl-3 ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-pink-600 mt-0"
      />
    </div>
  );
};

export default SearchBar;
