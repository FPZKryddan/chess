import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Auth({}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loggingIn, setLoggingIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const submitSignup = () => {
    const body = JSON.stringify({
      email: email,
      name: name,
      password: password,
    });
    fetch("http://127.0.0.1:3000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "Application/Json",
      },
      body: body,
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((error) => {
            throw new Error(error.message);
          });
        }
        return response.json();
      })
      .then((data) => {})
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) =>
      setCurrentUser(user),
    );

    return unsubscribe;
  }, []);

  const submitLogin = () => {
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        setLoading(false);
      })
      .catch((error) => console.log(error.message));
  };

  return (
    <div className="w-1/4 bg-secondary-brownish rounded-lg drop-shadow-2xl flex flex-col h-fit">
      {loading ? <LoadingSpinner /> : <h1></h1>}
      {loggingIn ? (
        <div>
          <h1 className="text-text-white w-full text-center text-3xl font-bold">
            Register!
          </h1>
          <p onClick={() => setLoggingIn(!loggingIn)}>Login!</p>
          <div className="flex flex-col gap-2 w-full p-2 mx-auto">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="Email"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Name"
            />
            <div className="flex flex-row gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Password"
              />
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="Confirm password"
              />
            </div>
            <button
              className="w-full bg-accent-blue mx-auto hover:brightness-125"
              onClick={submitSignup}
            >
              SIGNUP
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-text-white w-full text-center text-3xl font-bold">
            Login!
          </h1>
          <p onClick={() => setLoggingIn(!loggingIn)}>Signup!</p>
          <div className="flex flex-col gap-2 w-full p-2 mx-auto">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="Email"
            />
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Password"
            />
            <button
              className="w-full bg-accent-green mx-auto hover:brightness-125"
              onClick={submitLogin}
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
