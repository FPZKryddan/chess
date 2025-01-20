/* eslint-disable react/prop-types */
import { HiMiniUsers, HiMiniFlag } from "react-icons/hi2";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../contexts/AuthProvider";
import { useSocketContext } from "../contexts/SocketProvider";
import { ToastProvider, useToast } from "../contexts/ToastProvider";


const ProfileHeader = ({ userData, friendStatus }) => {
  const authData = useAuth();
  const socket = useSocketContext();
  const {createToast} = useToast();

  const handleChallenge = () => {
    if (!socket) return
    const challengeUid = userData.uid
    const data = {
      challenged: challengeUid
    }
    createToast("Success", "Sent challenge request");
    socket.emit("challenge:send", data)
  }

  const handleAddFriend = () => {
    if (!socket) return
    const toUid = userData.uid
    const data = {
      to: toUid
    }
    
    createToast("Success", "Sent friend request");
    socket.emit("friend:request", data)
  }


  return (
    <div className="flex flex-col w-full md:w-1/2 mx-auto justify-center max-h-96 items-center">
      {userData
        ?
        <div className="flex flex-col sm:flex-row p-4 gap-5">
          <img
              className="rounded-full w-auto aspect-square h-48"
              src="/profile.png"
            ></img>
          <div className="flex flex-col self-center">
            <h1 className="text-neutral-black text-3xl font-bold w-full text-center sm:text-left">{userData.displayName}</h1>
            {(authData) && authData.currentUser.uid != userData.uid &&
              <ul className="flex flex-row gap-2 text-text-white">
                {friendStatus != "accepted" &&
                  <li>
                    <button 
                    disabled={friendStatus == "pending"}
                    className="bg-accent-green p-2 px-4 rounded-md drop-shadow-lg hover:brightness-125 disabled:brightness-75"
                    onClick={handleAddFriend}
                    >Add friend</button>
                  </li>
                }
                <li>
                  <button 
                  className="bg-secondary-redish p-2 px-4 rounded-md drop-shadow-lg hover:brightness-125" 
                  onClick={handleChallenge}>Challenge</button>
                </li>
              </ul>
            }
          </div>
        </div>
        :
        <LoadingSpinner />
      }
    </div>
  );
};

export default ProfileHeader;
