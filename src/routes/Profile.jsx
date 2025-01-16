import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import FriendList from "../components/FriendList";
import MatchHistory from "../components/MatchHistory";
import ProfileHeader from "../components/ProfileHeader";
import { useParams } from "react-router-dom";

const Profile = () => {
  const {uid: paramUid} = useParams();
  const authData = useAuth();
  const [body, setBody] = useState("Match History");
  const [userData, setUserData] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);

  useEffect(() => {
    const uid = paramUid || authData.currentUser?.uid;
    if (!uid) return;

    let url = "http://localhost:3000/user/" + uid
    let options = {
      method: "GET",
      headers: {
        "Content-Type": "Application/Json"
      }
    } 
    fetch(url, options)
    .then((response) => response.json())
    .then((user) => {
      user.data["uid"] = uid;
      setUserData(user.data)
    });

    if (!paramUid) return;
    url = "http://localhost:3000/friend/" + uid + "/" + authData.currentUser.uid
    options = {
      method: "GET",
      headers: {
        "Content-Type": "Application/Json"
      }
    }
    fetch(url, options)
    .then((response) => response.json())
    .then((status) => {
      setFriendStatus(status.status)
    })

  }, [paramUid, authData.currentUser.uid])

  return (
    <div className="flex flex-col w-full h-full">
      <ProfileHeader userData={userData} friendStatus={friendStatus}/>
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
        ? <MatchHistory uid={paramUid || authData.currentUser?.uid}/>
        : <FriendList uid={paramUid || authData.currentUser?.uid}/>
        }
      </div>
    </div>
  );
};

export default Profile;
