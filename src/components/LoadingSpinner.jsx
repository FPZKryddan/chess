import { TailSpin } from "react-loader-spinner";

const LoadingSpinner = () => {
    return (
        <div className="w-full h-full flex justify-center items-center">
          <TailSpin
            visible={true}
            height={100}
            width={100}
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