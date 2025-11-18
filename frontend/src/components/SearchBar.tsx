import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    const { t } = useTranslation('searchbar');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('placeholder')}
                    className="bg-transparent text-white placeholder-white/60 px-4 py-2 rounded-l-xl focus:outline-none w-48 lg:w-64"
                />
                <button
                    type="submit"
                    className="cursor-pointer px-4 py-2 text-white hover:text-white/80 transition-colors"
                    aria-label={t('ariaLabel')}
                >
                    <Search className="w-5 h-5" />
                </button>
            </div>
        </form>
    );
};

export default SearchBar;