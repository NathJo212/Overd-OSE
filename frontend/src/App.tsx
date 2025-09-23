import {
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    Route
} from 'react-router';
import InscriptionEmployeur from './components/InscriptionEmployeur.tsx';
import Accueil from './components/Accueil.tsx';
import Login from "./components/Login.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route index element={<Accueil/>}/>
            <Route path="inscription-employeur" element={<InscriptionEmployeur/>}/>
            <Route path="login" element={<Login/>}/>
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
