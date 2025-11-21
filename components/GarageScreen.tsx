
import React from 'react';
import { Car, User } from '../types';
import { Plus, Car as CarIcon, Bike, ChevronRight, LogOut, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GarageScreenProps {
  user: User;
  cars: Car[];
  onSelectCar: (carId: string) => void;
  onAddCar: () => void;
  onLogout: () => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({ user, cars, onSelectCar, onAddCar, onLogout }) => {
  return (
    <div className="min-h-screen bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 bg-nsp-card border-b border-nsp-border sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Mon Garage</h1>
            <p className="text-nsp-sub text-sm">Bienvenue, {user.name}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 bg-nsp-input rounded-full text-nsp-sub hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
        
        {/* Stats Rapides */}
        <div className="flex gap-4">
          <div className="bg-nsp-input/50 px-3 py-1.5 rounded-lg border border-nsp-border text-xs text-gray-400 flex items-center gap-2">
            <CarIcon size={14} /> {cars.filter(c => c.type === 'car').length} Voitures
          </div>
          <div className="bg-nsp-input/50 px-3 py-1.5 rounded-lg border border-nsp-border text-xs text-gray-400 flex items-center gap-2">
            <Bike size={14} /> {cars.filter(c => c.type === 'motorcycle').length} Motos
          </div>
        </div>
      </div>

      {/* Liste des Véhicules */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-70">
            <div className="w-20 h-20 bg-nsp-input rounded-full flex items-center justify-center border-2 border-dashed border-nsp-sub">
              <CarIcon size={40} className="text-nsp-sub" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Garage Vide</h3>
              <p className="text-sm text-nsp-sub">Ajoutez votre premier véhicule pour commencer.</p>
            </div>
          </div>
        ) : (
          cars.map((car) => (
            <button
              key={car.id}
              onClick={() => onSelectCar(car.id)}
              className="w-full bg-nsp-card rounded-2xl border border-nsp-border overflow-hidden hover:border-nsp-primary transition-all transform hover:scale-[1.02] group text-left relative shadow-lg"
            >
              {/* Image de fond (Frontale ou placeholder) */}
              <div className="h-32 w-full bg-nsp-input relative">
                {car.photos.front ? (
                  <img src={car.photos.front} alt={car.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    {car.type === 'motorcycle' ? <Bike size={48} className="text-gray-700"/> : <CarIcon size={48} className="text-gray-700"/>}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-nsp-card to-transparent"></div>
                
                {/* Badge Plaque */}
                <div className="absolute top-3 left-3 bg-[#003399]/90 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-bold font-mono border border-white/20 shadow-md">
                  {car.plate}
                </div>
              </div>

              {/* Infos */}
              <div className="p-4 flex justify-between items-center relative z-10 -mt-6">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-nsp-primary transition-colors">{car.name}</h3>
                  <p className="text-xs text-nsp-sub capitalize">{car.fuelType} • {car.initialKm.toLocaleString()} km initiaux</p>
                </div>
                <div className="bg-nsp-primary rounded-full p-2 text-white shadow-lg shadow-red-900/50">
                   <ChevronRight size={20} />
                </div>
              </div>
              
              {/* Indicateur état (Simple simulation visuelle) */}
              <div className="px-4 pb-4 flex items-center gap-2">
                 {car.initialState.body === 'bad' || car.initialState.engine === 'bad' ? (
                    <span className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                      <AlertCircle size={10} /> Vigilance requise
                    </span>
                 ) : (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-500/30">
                      <CheckCircle2 size={10} /> Véhicule sain
                    </span>
                 )}
              </div>
            </button>
          ))
        )}
        
        <div className="h-20"></div> {/* Spacer pour le bouton flottant */}
      </div>

      {/* Bouton Flottant Ajout */}
      <div className="fixed bottom-8 right-8 z-30">
        <button 
          onClick={onAddCar}
          className="bg-nsp-primary hover:bg-red-600 text-white h-14 px-6 rounded-full shadow-lg shadow-red-900/40 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 font-bold"
        >
          <Plus size={24} /> AJOUTER
        </button>
      </div>
    </div>
  );
};
