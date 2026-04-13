
import { useState, useRef, useEffect } from 'react';
import { useSearch } from '../hooks/useWeather';
import './Searchbar.css';

export default function SearchBar() {
  const { query, setQuery, results, isSearching, select, clear } = useSearch();
  const wrapperRef = useRef(null);
  const [showResults, setShowResults] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(value.length > 0);
  };

  const handleSelectCity = async (city) => {
    await select(city);
    setShowResults(false);
    setQuery('');
  };

  const handleClear = () => {
    clear();
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input
          className="search-bar"
          type="text"
          placeholder="Search city..."
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button className="clear-btn" onClick={handleClear} title="Clear">
            ✕
          </button>
        )}
      </div>

      {isSearching && (
        <div className="search-loading">
          <span className="spinner"></span> Searching...
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((city) => (
            <div
              key={`${city.id}-${city.name}`}
              className="search-result-item"
              onClick={() => handleSelectCity(city)}
              role="button"
              tabIndex={0}
            >
              <span className="city-icon">🌐</span>
              <div className="city-info">
                <div className="city-name">{city.name}</div>
                <div className="city-region">
                  {city.region && `${city.region}, `}
                  {city.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="search-empty">
          No cities found for "{query}"
        </div>
      )}
    </div>
  );
}