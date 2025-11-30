import { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

const SearchableSelect = ({ options, value, onChange }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = search
        ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
        : options;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative', minWidth: '200px' }}>
            <input
                ref={inputRef}
                className="form-control"
                value={isOpen ? search : value}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                    setIsOpen(true);
                    setSearch('');
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                        setSearch('');
                        inputRef.current?.blur();
                    } else if (e.key === 'Enter' && filtered.length > 0) {
                        onChange(filtered[0] ?? value);
                        setIsOpen(false);
                        setSearch('');
                        inputRef.current?.blur();
                    }
                }}
            />
            {isOpen && (
                <div
                    className="dropdown-menu show"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 1000,
                    }}
                >
                    {filtered.map((option) => (
                        <button
                            key={option}
                            className={`dropdown-item ${option === value ? 'active' : ''}`}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                                setSearch('');
                            }}
                        >
                            {option}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <div className="dropdown-item disabled">No matches</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
