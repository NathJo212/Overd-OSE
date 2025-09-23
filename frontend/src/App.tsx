import {
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from 'react-router';
import InscriptionEmployeur from './components/InscriptionEmployeur.tsx';
import Accueil from './components/Accueil.tsx';
import Login from "./components/Login.tsx";
import CreerOffreStage from "./components/CreerOffreStage.tsx";
import DashBoardEmployeur from "./components/DashBoardEmployeur.tsx";
import DashBoardEtudiant from "./components/DashBoardEtudiant.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route index element={<Accueil/>}/>
            <Route path="inscription-employeur" element={<InscriptionEmployeur/>}/>
            <Route path="login" element={<Login/>}/>
            <Route path="dashboard-employeur" element={<DashBoardEmployeur/>}/>
            <Route path="dashboard-etudiant" element={<DashBoardEtudiant/>}/>
            <Route path="offre-stage" element={<CreerOffreStage/>}/>
        </>

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
