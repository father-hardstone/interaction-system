import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const STORAGE_KEYS = {
    services: 'masterData_services',
    diagnostics: 'masterData_diagnostics'
};

const MasterDataContext = createContext({ services: [], diagnostics: [] });

export const MasterDataProvider = ({ children }) => {
    const [services, setServices] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);

    useEffect(() => {
        const loadFromStorage = () => {
            try {
                const cachedServices = localStorage.getItem(STORAGE_KEYS.services);
                const cachedDiagnostics = localStorage.getItem(STORAGE_KEYS.diagnostics);
                if (cachedServices && cachedDiagnostics) {
                    const parsedServices = JSON.parse(cachedServices);
                    const parsedDiagnostics = JSON.parse(cachedDiagnostics);
                    if (Array.isArray(parsedServices) && Array.isArray(parsedDiagnostics)) {
                        setServices(parsedServices);
                        setDiagnostics(parsedDiagnostics);
                        return true;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse cached master data:', e);
            }
            return false;
        };

        const fetchAndCache = async () => {
            try {
                const [servicesRes, diagnosticsRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/diagnostics')
                ]);
                const servicesData = servicesRes.data || [];
                const diagnosticsData = diagnosticsRes.data || [];
                setServices(servicesData);
                setDiagnostics(diagnosticsData);
                localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(servicesData));
                localStorage.setItem(STORAGE_KEYS.diagnostics, JSON.stringify(diagnosticsData));
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };

        if (!loadFromStorage()) {
            fetchAndCache();
        }
    }, []);

    return (
        <MasterDataContext.Provider value={{ services, diagnostics }}>
            {children}
        </MasterDataContext.Provider>
    );
};

export const useMasterData = () => {
    const ctx = useContext(MasterDataContext);
    return ctx || { services: [], diagnostics: [] };
};
