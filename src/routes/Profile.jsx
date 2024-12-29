import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { TailSpin } from "react-loader-spinner";
import FriendList from "../components/FriendList";
import ProfileHeader from "../components/ProfileHeader";

const Profile = () => {
    const authData = useAuth();


    return (
        <div className="flex flex-col w-full h-full">
            <ProfileHeader />
            <div className="w-full h-fit bg-accent-green">
                <ul className="w-1/2 items-center justify-center flex flex-row mx-auto gap-2">
                    <li className="w-1/2 text-center border-b-2 cursor-pointer">Match History</li>
                    <li className="w-1/2 text-center border-b-2 cursor-pointer">Friend List</li>
                </ul>
            </div>
            <FriendList />
        </div>
    )
}

export default Profile;