import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { TailSpin } from "react-loader-spinner";
import FriendList from "../components/FriendList";
import ProfileHeader from "../components/ProfileHeader";

const Profile = () => {
  const authData = useAuth();
  const [body, setBody] = useState("Match History");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const uid = authData.currentUser.uid
    if (!uid) return

    const url = "http://localhost:3000/user/" + uid
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "Application/Json"
      }
    } 
    fetch(url, options)
    .then((response) => response.json())
    .then((user) => {
      setUserData(user.data)
    }) 
  })

  return (
    <div className="flex flex-col w-full h-full">
      <ProfileHeader userData={userData}/>
      <div className="w-full h-fit bg-accent-green">
        <ul className="w-1/2 items-center justify-center flex flex-row mx-auto gap-2">
          <li className="w-1/2 text-center border-b-2 cursor-pointer" onClick={() => setBody("Match History")}>
            Match History
          </li>
          <li className="w-1/2 text-center border-b-2 cursor-pointer" onClick={() => setBody("Friend List")}>
            Friend List
          </li>
        </ul>
      </div>
      <div>
        {body == "Match History"
        ? <div className="flex flex-col bg-accent-green w-full h-full"></div>
        : <FriendList />
        }
      </div>
    </div>
  );
};

export default Profile;
