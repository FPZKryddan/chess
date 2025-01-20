/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { useSocketContext } from "../contexts/SocketProvider";
import { ToastProvider, useToast } from "../contexts/ToastProvider";
import LoadingDots from "./LoadingDots";

const FriendList = ({uid}) => {
  const [friendsData, setFriendsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocketContext();
  const {createToast} = useToast();

  const { currentUser } = useAuth();
  console.log(currentUser)
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;

    const url = "http://localhost:3000/friends/" + uid;
    const options = {
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
        setIsLoading(false);
      });
  }, [uid]);

  const handleAccept = (docId, index) => {
    if (!socket) return;
    const friend = friendsData[index].name;
    const toastMsg = "Accepted " + friend + "!";
    let newFriendsData = friendsData;
    newFriendsData[index].status = "Accepted";

    setFriendsData(newFriendsData);
    createToast("Success", toastMsg)
    socket.emit("friend:accept", docId);
  };

  const handleDeny = (docId, index) => {
    if (!socket) return;
    const friend = friendsData[index].name;
    const toastMsg = "Denied " + friend + "!";
    let newFriendsData = friendsData;
    newFriendsData[index].status = "denied";

    setFriendsData(newFriendsData);
    createToast("Success", toastMsg)
    socket.emit("friend:deny", docId);
  };

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-1/2 h-full bg-accent-blue mx-auto">
          {friendsData ? (
            <ul className="w-full max-h-full p-2 overflow-auto text-text-white">
              {friendsData.filter((friend) => friend.status != "denied").map((friend, index) => {
                console.log(friend)
                return (
                  <li
                    key={index}
                    className="flex flex-row gap-5 h-16 items-center justify-evenly text-center align-baseline"
                  >
                    <img
                      className="aspect-square h-full w-auto rounded-full"
                      src="profile.png"
                    ></img>
                    <p className="max-w-24 overflow-hidden text-ellipsis">
                      {friend.name}
                    </p>
                    <button onClick={() => navigate("/profile/" + friend.uid)}>Profile</button>
                    {friend.status === "pending" && currentUser.uid === uid && (
                        <>
                          <button onClick={() => handleAccept(friend.docId, index)}>Accept</button>
                          <button onClick={() => handleDeny(friend.docId, index)}>Deny</button>
                        </>
                    )}
                    {friend.status === "pending" && currentUser.uid !== uid && (
                        <LoadingDots size={20}/>
                    )}
                    {currentUser && currentUser.uid === uid && friend.status != "pending" && (
                      <button onClick={() => handleDeny(friend.docId, index)}>Delete</button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <h1 className="text-center">You havent added any friends yet!</h1>
          )}
        </div>
      )}
    </>
  );
};


export default FriendList;