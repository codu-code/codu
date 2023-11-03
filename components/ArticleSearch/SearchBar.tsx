import React, { useState, useEffect } from "react";

interface Props {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

const SearchBar: React.FC<Props> = (props) => {
  const { searchTerm, setSearchTerm } = props;
  const [input, setInput] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(input);
    }, 500); // Debounce for 500 milliseconds

    return () => {
      clearTimeout(timer);
    };
  }, [input, setSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex grow justify-end">
      <label htmlFor="searchInput" aria-label="Enter search term"></label>
      <input
        onChange={handleInputChange}
        type="text"
        value={input}
        placeholder="Search"
        id="searchInput"
        name="searchInput"
        className="w-[213px] max-[500px]:w-full sm:text-sm sm:leading-6 ml-2 mr-2 mt-2 block rounded-md border-0 p-1.5 pl-3 ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-pink-600"
      />
    </div>
  );
};

export default SearchBar;
