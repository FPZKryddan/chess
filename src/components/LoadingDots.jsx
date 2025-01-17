/* eslint-disable react/prop-types */
import { ThreeDots } from "react-loader-spinner";

const LoadingDots = ({size=100}) => {
    return (
        <div className="w-full h-full flex justify-center items-center">
          <ThreeDots
            visible={true}
            height={size}
            width={size*1.8}
            color="#FFF"
            ariaLabel="loading"
            radius={1}
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
    )
}

export default LoadingDots;