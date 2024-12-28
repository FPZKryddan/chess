import { signOut } from "firebase/auth"
import { auth } from "../firebase/firebase"
import { useAuth } from "../contexts/AuthProvider"

export default function Navbar() {

    const {currentUser} = useAuth();

    const handleSignOut = () => {
        signOut(auth).then(() => {
            console.log("logged out")
        }).catch((error) => console.log(error))
    }

    return (
        <div className='flex flex-col fixed left-0 top-0 w-1/5 h-screen bg-primary-dark'>
            <nav>
                <ul>
                    <li>
                        <a href="/">HOME</a>
                    </li>
                    <li>
                        <a href="/chess">CHESS</a>
                    </li>
                    <li>
                        <a href="/auth">AUTH</a>
                    </li>   
                    {currentUser &&
                        <li>
                            <a onClick={handleSignOut}>Log out</a>
                        </li>
                    }                 
                </ul>
            </nav>
		</div>
    )
}