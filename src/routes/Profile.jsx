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

  const [friendsData, setFriendsData] = useState(null);
  const [friendsFetching, setFriendsFetching] = useState(true);

  const [matchHistoryData, setMatchHistoryData] = useState(null);
  const [matchHistoryFetching, setMatchHistoryFetching] = useState(true); 

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

    url = "http://localhost:3000/friends/" + authData.currentUser.uid;
    options = {
      method: "GET",
      headers: {
        "Content-Type": "Application/Json",
      },
    };
    fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        console.log(data.data);
        setFriendsData(data.data);
        setFriendsFetching(false);
      });

      
    url = "http://localhost:3000/user/history/" + uid
    options = {
        method: "GET",
        headers: {
            "Content-Type": "Application/Json"
        }
    }
    fetch(url, options)
        .then((response) => response.json())
        .then((matchHistory) => {
            console.log(matchHistory.matchHistory)
            setMatchHistoryData(matchHistory.matchHistory);
            setMatchHistoryFetching(false);
        })


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
        <ul className="w-full md:w-1/2 items-center justify-center flex flex-row mx-auto gap-2">
          <li 
          className={`w-full md:w-1/2 text-center border-b-2 cursor-pointer ${body == "Match History" ? "bg-primary-dark text-text-white rounded-t-3xl" : ""}`}
          onClick={() => setBody("Match History")}>
            Match History
          </li>
          <li 
          className={`w-full md:w-1/2 text-center border-b-2 cursor-pointer ${body == "Friend List" ? "bg-primary-dark text-text-white rounded-t-3xl" : ""}`} 
          onClick={() => setBody("Friend List")}>
            Friend List
          </li>
        </ul>
      <div>
        {body == "Match History"
        ? <MatchHistory uid={paramUid || authData.currentUser?.uid} matchHistoryData={matchHistoryData} matchHistoryFetching={matchHistoryFetching}/>
        : <FriendList uid={paramUid || authData.currentUser?.uid} friendsData={friendsData} updateFriendsData={setFriendsData} friendsFetching={friendsFetching}/>
        }
      </div>
    </div>
  );
};

export default Profile;
