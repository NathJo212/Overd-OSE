import {
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from 'react-router';
import InscriptionEmployeur from './components/InscriptionEmployeur.tsx';
import Accueil from './components/Accueil.tsx';
import Login from "./components/Login.tsx";
import InscriptionEtudiant from "./components/InscriptionEtudiant.tsx";
import CreerOffreStage from "./components/CreerOffreStage.tsx";
import DashBoardEmployeur from "./components/DashBoardEmployeur.tsx";
import DashBoardEtudiant from "./components/DashBoardEtudiant.tsx";
import ApprouverRefuserCV from './components/ApprouverRefuserCV.tsx';
import VisualiserOffresGestionnaire from './components/VisualiserOffresGestionnaire.tsx';
import LayoutGlobal from './components/LayoutGlobal.tsx';
import TeleversementCv from './components/TeleversementCv.tsx';
import CandidaturesRecues from "./components/CandidaturesRecues.tsx";
import CandidaturesEtudiant from "./components/CandidaturesEtudiant.tsx";
import DashboardGestionnaire from "./components/DashboardGestionnaire.tsx";
import EntentesStageGestionnaire from "./components/EntentesStageGestionnaire.tsx";
import EntentesEtudiants from "./components/EntentesEtudiants.tsx";
import EntentesEmployeurs from "./components/EntentesEmployeurs.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<LayoutGlobal />}>
            <Route index element={<Accueil/>}/>
            <Route path="inscription-employeur" element={<InscriptionEmployeur/>}/>
            <Route path="inscription-etudiant" element={<InscriptionEtudiant/>}/>
            <Route path="login" element={<Login/>}/>
            <Route path="dashboard-employeur" element={<DashBoardEmployeur/>}/>
            <Route path="dashboard-etudiant" element={<DashBoardEtudiant/>}/>
            <Route path="offre-stage" element={<CreerOffreStage/>}/>
            <Route path="dashboard-gestionnaire" element={<DashboardGestionnaire/>}/>
            <Route path="visualiser-offres" element={<VisualiserOffresGestionnaire/>}/>
            <Route path="cvs-etudiants-gestionnaire" element={<ApprouverRefuserCV/>}/>
            <Route path="televersement-cv" element={<TeleversementCv/>}/>
            <Route path="candidatures-recues" element={<CandidaturesRecues/>}/>
            <Route path="mes-candidatures" element={<CandidaturesEtudiant/>}/>
            <Route path="mes-ententes-stage" element={<EntentesEtudiants/>}/>
            <Route path="ententes-stage-gestionnaire" element={<EntentesStageGestionnaire/>}/>
            <Route path="mes-ententes" element={<EntentesEmployeurs/>}/>
        </Route>
    )
);

function App() {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default App