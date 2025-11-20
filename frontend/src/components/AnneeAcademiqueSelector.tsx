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

            // Par défaut, sélectionner l'année courante
            const anneeCourante = anneesData.find(a => a.estCourante);
            if (anneeCourante) {
                setSelectedAnnee(anneeCourante.anneeDebut.toString());
                onAnneeChange(anneeCourante.anneeDebut.toString());
            } else if (anneesData.length > 0) {
                // Si aucune année courante, sélectionner la première
                setSelectedAnnee(anneesData[0].anneeDebut.toString());
                onAnneeChange(anneesData[0].anneeDebut.toString());
            } else {
                // Aucune année disponible
                setSelectedAnnee('');
                onAnneeChange('');
            }
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

    // Trier les années : courante d'abord, puis futures, puis passées (du plus récent au plus ancien)
    const anneesSorted = [...annees].sort((a, b) => {
        if (a.estCourante) return -1;
        if (b.estCourante) return 1;
        if (a.estFuture && !b.estFuture) return -1;
        if (!a.estFuture && b.estFuture) return 1;
        return b.anneeDebut - a.anneeDebut; // Plus récent en premier
    });

    return (
        <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300">
                <Calendar size={20} />
                Année académique :
            </label>
            <select
                value={selectedAnnee}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 min-w-[250px]"
            >
                {/* Années disponibles - courante en premier avec format spécial */}
                {anneesSorted.map(annee => (
                    <option key={annee.id} value={annee.anneeDebut.toString()}>
                        {getLibelleAnnee(annee)}{annee.estCourante ? ' (Année courante)' : ''}{annee.estFuture ? ' (À venir)' : ''}
                    </option>
                ))}

                {/* Option "Toutes" pour le gestionnaire */}
                {includeToutes && (
                    <option value="toutes">Toutes les années</option>
                )}
            </select>
        </div>
    );
};

export default AnneeAcademiqueSelector;

