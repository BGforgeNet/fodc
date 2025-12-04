import { useState, useRef, useEffect } from 'react';
import styles from './SearchableSelect.module.css';

interface IconInfo {
    src: string;
    title: string;
}

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    narrow?: boolean;
    /** Optional icons to show for each option. Maps option value to array of icons. */
    optionIcons?: Record<string, IconInfo[]>;
}

const SearchableSelect = ({ options, value, onChange, narrow = false, optionIcons }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;

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
        <div ref={containerRef} className={narrow ? styles.containerNarrow : styles.container}>
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
                <div className={`dropdown-menu show ${styles.dropdown}`}>
                    {filtered.map((option) => (
                        <button
                            key={option}
                            className={`dropdown-item ${option === value ? 'active' : ''} ${styles.optionWithIcons}`}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                                setSearch('');
                            }}
                        >
                            <span>{option}</span>
                            {optionIcons?.[option] && (
                                <span className={styles.optionIcons}>
                                    {optionIcons[option]!.map((icon, i) => (
                                        <img key={i} src={icon.src} alt={icon.title} title={icon.title} className={styles.optionIcon} />
                                    ))}
                                </span>
                            )}
                        </button>
                    ))}
                    {filtered.length === 0 && <div className="dropdown-item disabled">No matches</div>}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
