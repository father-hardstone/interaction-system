import { createContext, useContext, useState, useCallback } from 'react';

const UserDashboardNavContext = createContext(null);

export const UserDashboardNavProvider = ({ children }) => {
    const [navState, setNavState] = useState(null);

    const register = useCallback((data) => {
        setNavState(data);
    }, []);

    const unregister = useCallback(() => {
        setNavState(null);
    }, []);

    return (
        <UserDashboardNavContext.Provider value={{ navState, register, unregister }}>
            {children}
        </UserDashboardNavContext.Provider>
    );
};

export const useUserDashboardNav = () => {
    const ctx = useContext(UserDashboardNavContext);
    if (!ctx) throw new Error('useUserDashboardNav must be used within UserDashboardNavProvider');
    return ctx;
};
