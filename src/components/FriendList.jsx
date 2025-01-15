/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

const FriendList = ({uid}) => {
  const [friendsData, setFriendsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-1/2 h-full bg-accent-blue mx-auto">
          {friendsData ? (
            <ul className="w-full max-h-full p-2 overflow-auto text-text-white">
              {friendsData.map((friend, index) => (
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
                  <p>Online</p>
                  <button>Delete</button>
                </li>
              ))}
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