import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthProvider";
import {
  HiHome,
  HiMiniUser,
  HiMiniTrophy,
  HiMiniAdjustmentsHorizontal,
  HiMiniArrowRightOnRectangle,
} from "react-icons/hi2";
import { GiChessRook } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log("logged out");
      })
      .catch((error) => console.log(error));
  };

  const navItems = [
    { label: "Home", icon: <HiHome className="size-6" />, href: "/" },
    {
      label: "Profile",
      icon: <HiMiniUser className="size-6" />,
      href: "/profile",
    },
    { label: "Play", icon: <GiChessRook className="size-6" />, href: "/chess" },
    {
      label: "Leaderboard",
      icon: <HiMiniTrophy className="size-6" />,
      href: "/leaderboard",
    },
    {
      label: "Settings",
      icon: <HiMiniAdjustmentsHorizontal className="size-6" />,
      href: "/settings",
    },
  ];

  return (
    <div
      className="group flex flex-col w-16 pt-12 hover:w-48 h-full 
            bg-primary-dark items-start duration-200 divide-y-[1px] text-text-white"
    >
      <div className="flex flex-row px-3 py-4 space-x-3 items-center h-20">
        <img
          className="size-10 mt-2 rounded-full"
          src="profile.png"
          alt="Profile"
        />
        <div className="hidden group-hover:inline-block h-full overflow-hidden whitespace-nowrap transition-all duration-200">
          <h1 className="font-bold text-lg">user test</h1>
          <p className="text-sm">jabba</p>
        </div>
      </div>

      {navItems.map((item, index) => (
        <div
          key={index}
          className="group-hover:flex hover:bg-secondary-redish cursor-pointer flex items-center w-full py-4 px-3 space-x-3 transition duration-200"
          onClick={() => navigate(item.href)}
        >
          <div className="ml-2">{item.icon}</div>
          <span className="hidden group-hover:inline-block text-sm w-full">
            {item.label}
          </span>
        </div>
      ))}
      {currentUser && (
        <div
          className="group-hover:flex hover:bg-secondary-redish cursor-pointer flex items-center w-full py-4 px-3 space-x-3 transition duration-200"
          onClick={handleSignOut}
        >
          <div className="ml-2">
            <HiMiniArrowRightOnRectangle className="size-6" />
          </div>
          <span className="hidden group-hover:inline-block overflow-hidden whitespace-nowrap text-sm w-full">
            Log out
          </span>
        </div>
      )}
    </div>
  );
}
