import React, { useState, useEffect } from 'react';
import { Screen, User, Car, Invoice, AIStatus, TechnicalSpecs } from './types';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { GarageScreen } from './components/GarageScreen';
import { AddInvoiceScreen } from './components/AddInvoiceScreen';
import { SellCarScreen } from './components/SellCarScreen';
import { BuyCarScreen } from './components/BuyCarScreen';
import { AssistanceScreen } from './components/AssistanceScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { calculateMaintenanceStatus } from './services/mechanicRules';

// CLÉS DE STOCKAGE SÉCURISÉ (Simulation locale)
const STORAGE_KEYS = {
  USERS: 'AUTOBOOK_USERS_V1',
  CARS: 'AUTOBOOK_CARS_V1',
  INVOICES: 'AUTOBOOK_INVOICES_V1',
  SESSION: 'AUTOBOOK_SESSION_ID',
  LAST_EMAIL: 'AUTOBOOK_LAST_EMAIL' // Pour pré-remplir le champ email
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>(Screen.AUTH);
  const [user, setUser] = useState<User | null>(null);
  
  // --- CHARGEMENT DES DONNÉES DEPUIS LE STOCKAGE LOCAL ---
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : [
        { id: 'user-demo-1', name: 'Jean Dupont', email: 'jean@test.com', password: 'demo', role: 'user' },
        { id: 'admin-001', name: 'Administrateur NSP', email: 'admin@autobook.com', password: 'admin', role: 'admin' }
      ];
    } catch (e) { return []; }
  });

  const [allCars, setAllCars] = useState<Car[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [allInvoices, setAllInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // --- AUTO-LOGIN : VÉRIFICATION DE SESSION ---
  useEffect(() => {
    try {
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionId) {
        const foundUser = allUsers.find(u => u.id === sessionId);
        if (foundUser) {
          console.log("Session restaurée pour :", foundUser.name);
          setUser(foundUser);
          setScreen(foundUser.role === 'admin' ? Screen.ADMIN_DASHBOARD : Screen.GARAGE);
        }
      }
    } catch (e) { console.error("Session error", e); }
  }, []);

  // --- SAUVEGARDE AUTOMATIQUE (SAFE) ---
  const safeSave = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        alert("⚠️ ATTENTION : La mémoire de votre téléphone est pleine. Impossible de sauvegarder les nouvelles photos. Veuillez supprimer d'anciens véhicules.");
      } else {
        console.error("Storage Error", e);
      }
    }
  };

  useEffect(() => { safeSave(STORAGE_KEYS.USERS, allUsers); }, [allUsers]);
  useEffect(() => { safeSave(STORAGE_KEYS.CARS, allCars); }, [allCars]);
  useEffect(() => { safeSave(STORAGE_KEYS.INVOICES, allInvoices); }, [allInvoices]);

  // User Session Data (Filtered)
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    status: 'neutral',
    message: 'En attente de données...'
  });

  // Filtres pour l'utilisateur connecté
  const userCars = allCars.filter(c => c.ownerId === user?.id);
  const activeCar = userCars.find(c => c.id === activeCarId) || null;
  const activeCarInvoices = allInvoices.filter(inv => inv.carId === activeCarId);

  useEffect(() => {
    if (activeCar) {
      if (activeCarInvoices.length > 0) {
        const status = calculateMaintenanceStatus(activeCar, activeCarInvoices);
        setAiStatus(status);
      } else {
        setAiStatus({
          status: 'warning',
          message: 'Historique vide. Ajoutez votre dernière révision pour activer le suivi intelligent.',
          nextDeadline: 'Données manquantes'
        });
      }
    }
  }, [activeCarInvoices, activeCar]);

  const handleLogin = (loggedInUser: User) => {
    const existingUserIndex = allUsers.findIndex(u => u.id === loggedInUser.id);
    if (existingUserIndex >= 0) {
       const updatedUsers = [...allUsers];
       updatedUsers[existingUserIndex] = loggedInUser;
       setAllUsers(updatedUsers);
    } else {
       setAllUsers(prev => [...prev, loggedInUser]);
    }

    setUser(loggedInUser);
    safeSave(STORAGE_KEYS.SESSION, loggedInUser.id);
    safeSave(STORAGE_KEYS.LAST_EMAIL, loggedInUser.email);

    if (loggedInUser.role === 'admin') {
      setScreen(Screen.ADMIN_DASHBOARD);
    } else {
      setScreen(Screen.GARAGE);
    }
  };

  const handleForgotPasswordRequest = (email: string) => {
    const userExists = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      setAllUsers(prev => prev.map(u => 
        u.email.toLowerCase() === email.toLowerCase() 
          ? { ...u, passwordResetRequested: true } 
          : u
      ));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setScreen(Screen.AUTH);
  };

  const handleCarOnboarding = (newCar: Car) => {
    const carWithOwner = { ...newCar, ownerId: user!.id };
    setAllCars(prev => [...prev, carWithOwner]);
    setActiveCarId(newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handleSaveInvoice = (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => {
    setAllInvoices(prev => [invoice, ...prev]);
    if (detectedSpecs && activeCarId) {
      handleUpdateSpecs(detectedSpecs);
    } else {
      setScreen(Screen.DASHBOARD);
    }
  };

  const handleUpdateSpecs = (specs: TechnicalSpecs) => {
    if (!activeCarId) return;
    setAllCars(prev => prev.map(c => {
      if (c.id === activeCarId) {
        const newSpecs = { ...c.specs, ...specs };
        Object.keys(newSpecs).forEach(key => {
            if ((newSpecs as any)[key] === undefined || (newSpecs as any)[key] === '') {
                delete (newSpecs as any)[key];
            }
        });
        return { ...c, specs: newSpecs };
      }
      return c;
    }));
    setScreen(Screen.DASHBOARD);
  };

  const handleSellCar = (buyerEmail: string) => {
    if (!activeCarId) return;
    const remainingCars = allCars.filter(c => c.id !== activeCarId);
    setAllCars(remainingCars); 
    setActiveCarId(null);
    setScreen(Screen.GARAGE);
  };

  const handleBuyCarImport = (newCar: Car, newInvoices: Invoice[]) => {
    const carWithOwner = { ...newCar, ownerId: user!.id };
    setAllCars(prev => [...prev, carWithOwner]);
    setAllInvoices(prev => [...prev, ...newInvoices]);
    setActiveCarId(newCar.id);
    setScreen(Screen.DASHBOARD);
  };

  const handleDeleteCar = (carIdToDelete: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ? L'action sera enregistrée par l'administrateur.")) {
      setAllCars(prev => prev.filter(c => c.id !== carIdToDelete));
      setAllInvoices(prev => prev.filter(i => i.carId !== carIdToDelete));
      setActiveCarId(null);
      setScreen(Screen.GARAGE);
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.AUTH:
        return <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={handleForgotPasswordRequest} existingUsers={allUsers} />;
      case Screen.ADMIN_DASHBOARD:
        if (user?.role !== 'admin') return <AuthScreen onLogin={handleLogin} onForgotPasswordRequest={handleForgotPasswordRequest} existingUsers={allUsers} />;
        return <AdminDashboardScreen currentUser={user} allUsers={allUsers} allCars={allCars} allInvoices={allInvoices} onLogout={handleLogout} />;
      case Screen.GARAGE:
        return <GarageScreen user={user!} cars={userCars} onSelectCar={(id) => { setActiveCarId(id); setScreen(Screen.DASHBOARD); }} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={handleLogout} />;
      case Screen.ONBOARDING:
        return <OnboardingScreen onSave={handleCarOnboarding} onCancel={userCars.length > 0 ? () => setScreen(Screen.GARAGE) : undefined} />;
      case Screen.DASHBOARD:
        if (!activeCar) return <GarageScreen user={user!} cars={userCars} onSelectCar={setActiveCarId} onAddCar={() => setScreen(Screen.ONBOARDING)} onLogout={handleLogout} />;
        return <DashboardScreen user={user!} car={activeCar} invoices={activeCarInvoices} aiStatus={aiStatus} onBackToGarage={() => setScreen(Screen.GARAGE)} onAddInvoice={() => setScreen(Screen.ADD_INVOICE)} onSellCar={() => setScreen(Screen.SELL_CAR)} onBuyCar={() => setScreen(Screen.BUY_CAR)} onAssistance={() => setScreen(Screen.ASSISTANCE)} onDeleteCar={() => handleDeleteCar(activeCar.id)} onUpdateSpecs={handleUpdateSpecs} />;
      case Screen.ADD_INVOICE:
        if (!activeCar) return null;
        return <AddInvoiceScreen carId={activeCar.id} onSave={handleSaveInvoice} onCancel={() => setScreen(Screen.DASHBOARD)} />;
      case Screen.SELL_CAR:
        if (!activeCar) return null;
        return <SellCarScreen car={activeCar} invoices={activeCarInvoices} onCancel={() => setScreen(Screen.DASHBOARD)} onConfirmTransfer={handleSellCar} />;
      case Screen.BUY_CAR:
        return <BuyCarScreen onCancel={() => setScreen(Screen.GARAGE)} onImportSuccess={handleBuyCarImport} />;
      case Screen.ASSISTANCE:
        return <AssistanceScreen onBack={() => setScreen(Screen.DASHBOARD)} />;
      default:
        return <div className="text-white">404 Not Found</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-nsp-bg shadow-2xl min-h-screen overflow-hidden relative">
      <div className={screen === Screen.ADMIN_DASHBOARD ? "fixed inset-0 z-50 overflow-auto bg-black" : ""}>
         {renderScreen()}
      </div>
    </div>
  );
};

export default App;