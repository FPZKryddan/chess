/* eslint-disable react/prop-types */
import { TailSpin } from "react-loader-spinner";

const LoadingSpinner = ({size=100}) => {
    return (
        <div className="w-full h-full flex justify-center items-center">
          <TailSpin
            visible={true}
            height={size}
            width={size}
            color="#4fa94d"
            ariaLabel="loading"
            radius={1}
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
    )
}

export default LoadingSpinner;