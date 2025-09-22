import {
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from 'react-router';
import InscriptionEmployeur from './components/InscriptionEmployeur.tsx';
import Accueil from './components/Accueil.tsx';
import InscriptionEtudiant from "./components/InscriptionEtudiant.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route index element={<Accueil/>}/>
            <Route path="inscription-employeur" element={<InscriptionEmployeur/>}/>
            <Route path="inscription-etudiant" element={<InscriptionEtudiant/>}/>
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
