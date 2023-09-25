
interface Props {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar = (props: Props) => {
  const { searchTerm, setSearchTerm } = props;

  console.log(searchTerm);

  return (
    <>
      <label htmlFor="searchInput" aria-label="Enter search term"></label>
      <input
        onChange={(e) => setSearchTerm(e.target.value)}
        type="text"
        value={searchTerm}
        placeholder="search"
        id="searchInput"
        name="searchInput"
        className="sm:order-none sm:min-width:'300' sm:w-1/2 sm:max-w-sm sm:text-sm sm:leading-6 order-4 w-full ml-2 mr-2 mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-pink-600"
      />
    </>
  );
};

export default SearchBar;
