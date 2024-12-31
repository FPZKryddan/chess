import React, {createContext, useContext} from 'react';

const SocketContext = createContext();

export const SocketProvider = ({socket, children}) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocketContext = () => {
    return useContext(SocketContext)
}