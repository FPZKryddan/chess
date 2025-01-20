/* eslint-disable react/prop-types */
import React, {createContext, useContext, useEffect, useState } from "react";
import { HiX } from "react-icons/hi";

const ToastContext = createContext();

export const ToastProvider = ({children}) => {
    const [toastList, setToastList] = useState([]);

    const createToast = (type, message, duration=3000) => {
        const toast = {
            id: Math.random(),
            type: type,
            message: message,
            isEntering: true,
            isClosing: false,
            duration: duration
        }
        setToastList((prev) => [...prev, toast])

        setTimeout(() => {
            setToastList((prev) =>
                prev.map((t) =>
                    t.id === toast.id ? { ...t, isEntering: false } : t
                )
            );
        }, 200);

        setTimeout(() => {
            handleClose(toast.id);
        }, toast.duration)
    }

    const createRequestToast = (message, acceptCallback, denyCallback, requestId) => {
        const toast = {
            id: Math.random(),
            type: "Request",
            message: message,
            isEntering: true,
            isClosing: false,
            duration: 30000,
            acceptCallback: acceptCallback,
            denyCallback: denyCallback,
            requestId: requestId
        }
        setToastList((prev) => [...prev, toast])

        setTimeout(() => {
            setToastList((prev) =>
                prev.map((t) =>
                    t.id === toast.id ? { ...t, isEntering: false } : t
                )
            );
        }, 200);

        setTimeout(() => {
            handleClose(toast.id);
        }, toast.duration)
    }

    const handleClose = (id) => {
        setToastList((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, isClosing: true } : toast
            )
        );

        setTimeout(() => {
            setToastList((prev) => prev.filter((toast) => toast.id !== id));
        }, 200);
        // setToastList(toastList.filter((toast) => toast.id != id));
    }

    const handleAccept = (toast) => {
        handleClose(toast.id)
        toast.acceptCallback(toast.requestId)
    }

    const handleDeny = (toast) => {
        handleClose(toast.id)
        toast.denyCallback(toast.requestId)
    }

    return (
        <ToastContext.Provider value={{ createToast, createRequestToast }}>
            {children}
            <ul className="fixed flex flex-col top-10 right-10 w-60 h-fit gap-5">
                {toastList.map((toast, index) => (
                    <li key={index} className={`w-full 
                        ${toast.type == "Success"
                            ? "bg-accent-green"
                            : toast.type == "Error"
                            ? "bg-secondary-redish"
                            : toast.type == "Request"
                            ? "bg-accent-blue"
                            : "bg-secondary-brownish"
                        } 
                        rounded-lg flex flex-col p-2 transition-all duration-200 
                        ${toast.isEntering
                            ? "-translate-y-[1000px]"
                            : "translate-y-0"
                        } 
                        ${toast.isClosing 
                            ? "opacity-0 translate-x-full" 
                            : "opacity-100"
                        }`}>
                        <div
                            className="h-1 bg-primary-dark rounded"
                            style={{
                                width: "100%",
                                animation: `progressbarShrink ${toast.duration}ms linear forwards`,
                            }}
                        ></div>
                        <div className="flex flex-row items-center justify-between">
                            <h1 className="flex-grow w-full text-center text-lg text-text-white font-bold pl-6">{toast.type}</h1>
                            <span className="cursor-pointer text-text-white p-1 w-6" onClick={() => {handleClose(toast.id)}}>
                                <HiX />
                            </span>
                        </div>
                        <p className="text-left text-sm text-text-white">{toast.message}</p>
                        {toast.type == "Request" && 
                            <div className="flex flex-row w-full items-center justify-evenly gap-2 mt-2">
                                <button className="bg-accent-green rounded-md p-2 w-full" onClick={() => handleAccept(toast)}>Accept</button>
                                <button className="bg-secondary-redish rounded-md p-2 w-full" onClick={() => handleDeny(toast)}>Deny</button>
                            </div> 
                        }
                    </li>
                ))}
            </ul>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext);