
import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import { useApp } from './AppContext';
import { hashPassword } from '../utils/crypto';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users, saveRecord } = useApp();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoginError(null);
    
    if (!email || !pass) {
      setLoginError('Preencha todos os campos.');
      return false;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = pass.trim();
    
    // Busca o usuário exclusivamente pelo e-mail
    const dbUser = users.find(u => u.email && u.email.toLowerCase().trim() === cleanEmail);
    
    const inputHash = await hashPassword(cleanPass);
    const storedPass = dbUser ? String(dbUser.password || "").trim() : "";

    // Comparação padrão por Hash
    const isHashMatch = (dbUser && inputHash !== "" && inputHash === storedPass);
    
    // Regra de Ouro/Recuperação: Novo Admin HAP
    const isMasterBypass = (cleanEmail === "clayton.freitas@hap.org.br" && cleanPass === "Admin1");

    if (isHashMatch || isMasterBypass) {
      let userToLogin = dbUser;

      // Se entrou pelo bypass mas o usuário não existe no banco, cria ou usa um temporário
      if (isMasterBypass && !dbUser) {
        userToLogin = {
          id: crypto.randomUUID(),
          name: "Clayton Freitas (Admin)",
          email: "clayton.freitas@hap.org.br",
          role: "ADMIN" as any,
          password: inputHash
        };
        // Tenta salvar no banco se possível
        try { await saveRecord('users', userToLogin); } catch (e) {}
      } else if (isMasterBypass && dbUser && !isHashMatch) {
        // Sincroniza hash se entrou pelo bypass mas a senha estava diferente
        try { await saveRecord('users', { ...dbUser, password: inputHash }); } catch (e) {}
      }

      setCurrentUser(userToLogin!);
      setIsAuthenticated(true);
      return true;
    } else {
      setLoginError('Credenciais incorretas.');
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoginError(null);
  };

  const updateCurrentUser = (user: User) => setCurrentUser(user);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, updateCurrentUser, loginError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
