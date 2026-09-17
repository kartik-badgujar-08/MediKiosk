import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type ABHAProfile, type HPRDoctorProfile } from '../services/api';

export type UserRole = 'patient' | 'doctor' | null;

interface AuthContextType {
  role: UserRole;
  token: string | null;
  patientProfile: ABHAProfile | null;
  doctorProfile: HPRDoctorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginPatient: (profile: ABHAProfile, token: string) => void;
  loginDoctor: (profile: HPRDoctorProfile, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'medikiosk_token';
const ROLE_KEY = 'medikiosk_role';
const PATIENT_KEY = 'medikiosk_patient_profile';
const DOCTOR_KEY = 'medikiosk_doctor_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  });
  const [role, setRole] = useState<UserRole>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem(ROLE_KEY) as UserRole) : null;
  });
  const [patientProfile, setPatientProfile] = useState<ABHAProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(PATIENT_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [doctorProfile, setDoctorProfile] = useState<HPRDoctorProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(DOCTOR_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on app launch
  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const session = await api.getGovSession();
        if (session && session.role) {
          setRole(session.role);
        }
      } catch (err) {
        console.warn('Session verification expired or unreachable:', err);
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, [token]);

  const loginPatient = (profile: ABHAProfile, newToken: string) => {
    setToken(newToken);
    setRole('patient');
    setPatientProfile(profile);
    setDoctorProfile(null);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ROLE_KEY, 'patient');
    localStorage.setItem(PATIENT_KEY, JSON.stringify(profile));
    localStorage.removeItem(DOCTOR_KEY);
  };

  const loginDoctor = (profile: HPRDoctorProfile, newToken: string) => {
    setToken(newToken);
    setRole('doctor');
    setDoctorProfile(profile);
    setPatientProfile(null);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ROLE_KEY, 'doctor');
    localStorage.setItem(DOCTOR_KEY, JSON.stringify(profile));
    localStorage.removeItem(PATIENT_KEY);
  };

  const logout = async () => {
    try {
      await api.logoutGov();
    } catch (e) {
      // ignore
    }
    setToken(null);
    setRole(null);
    setPatientProfile(null);
    setDoctorProfile(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PATIENT_KEY);
    localStorage.removeItem(DOCTOR_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        token,
        patientProfile,
        doctorProfile,
        isAuthenticated: !!token && !!role,
        isLoading,
        loginPatient,
        loginDoctor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
