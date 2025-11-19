import { useEffect, useState } from 'react';
import { anneeAcademiqueService, getLibelleAnnee } from '../services/AnneeAcademiqueService';
import type { AnneeAcademiqueDTO } from '../services/AnneeAcademiqueService';
import { Calendar } from 'lucide-react';

interface AnneeAcademiqueSelectorProps {
    onAnneeChange: (annee: string) => void;
    includeToutes?: boolean; // Pour le gestionnaire qui peut voir toutes les années
}

const AnneeAcademiqueSelector = ({ onAnneeChange, includeToutes = false }: AnneeAcademiqueSelectorProps) => {
    const [annees, setAnnees] = useState<AnneeAcademiqueDTO[]>([]);
    const [selectedAnnee, setSelectedAnnee] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnnees();
    }, []);

    const loadAnnees = async () => {
        setLoading(true);
        try {
            const anneesData = await anneeAcademiqueService.getAllAnnees();
            setAnnees(anneesData);

            // Par défaut, sélectionner l'année courante (qui est vide, donc affichera l'année courante côté backend)
            setSelectedAnnee('');
            onAnneeChange('');
        } catch (error) {
            console.error('Erreur lors du chargement des années:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedAnnee(value);
        onAnneeChange(value);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                <Calendar size={20} />
                <span>Chargement...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
                <Calendar size={20} />
                Année académique :
            </label>
            <select
                value={selectedAnnee}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
                {/* Option par défaut : Année courante */}
                <option value="">
                    Année courante {annees.find(a => a.estCourante) ?
                        `(${getLibelleAnnee(annees.find(a => a.estCourante)!)})` : ''}
                </option>

                {/* Années disponibles */}
                {annees.map(annee => (
                    <option key={annee.id} value={annee.anneeDebut.toString()}>
                        {getLibelleAnnee(annee)} {annee.estCourante ? '(Courante)' : ''}
                        {annee.estFuture ? '(À venir)' : ''}
                        {annee.estPassee ? '(Passée)' : ''}
                    </option>
                ))}

                {/* Option "Toutes" pour le gestionnaire */}
                {includeToutes && (
                    <option value="toutes">Toutes les années (Historique complet)</option>
                )}
            </select>
        </div>
    );
};

export default AnneeAcademiqueSelector;

