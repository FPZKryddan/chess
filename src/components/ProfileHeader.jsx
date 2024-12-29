import { HiMiniUsers, HiMiniFlag } from "react-icons/hi2";
import LoadingSpinner from "./LoadingSpinner";


const ProfileHeader = ({userData}) => {
  return (
    <div className="flex flex-col w-full max-h-96 p-5 bg-secondary-redish items-center">
      {userData 
      ?
        <div className="flex flex-row w-1/2 h-full bg-secondary-brownish">
          <img
            className="rounded-full w-auto aspect-square h-full p  -5"
            src="profile.png"
            ></img>
          <div className="flex flex-col p-5 w-full gap-12">
            <h1 className="text-text-white text-3xl font-bold w-full mt-12">
              {userData.displayName}
            </h1>
            <ul className="flex flex-row w-full bg-primary-dark justify-evenly">
              <li className="flex flex-row">
                <span>7</span>
                <HiMiniUsers className="size-6" />
              </li>
              <li className="flex flex-row">
                <HiMiniFlag className="size-6" />
                <span className="text-[#00FF00]">21</span>|
                <span className="text-[#FF0000]">15</span>
              </li>
            </ul>
            <p>Member since november 6969</p>
          </div>
        </div>
        :
        <LoadingSpinner />
      }
    </div>
  );
};

export default ProfileHeader;
