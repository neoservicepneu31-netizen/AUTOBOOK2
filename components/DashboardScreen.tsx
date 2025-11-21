
import React, { useEffect, useState, useRef } from 'react';
import { User, Car, Invoice, AIStatus, ManufacturerSpecs, TechnicalSpecs } from '../types';
import { Plus, FileText, AlertTriangle, ArrowLeft, Sparkles, Calendar, ArrowRightLeft, DownloadCloud, Wrench, Phone, Droplet, Gauge, Activity, Trash2, Bell, BellOff, Fuel, TrendingUp, ClipboardList, X, Save, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { getPersonalizedMaintenance } from '../services/geminiService';
import { requestNotificationPermission, sendLocalNotification } from '../services/notificationService';

interface DashboardScreenProps {
  user: User;
  car: Car; // The active car
  invoices: Invoice[];
  aiStatus: AIStatus;
  onBackToGarage: () => void;
  onAddInvoice: () => void;
  onSellCar: () => void;
  onBuyCar: () => void;
  onAssistance: () => void;
  onDeleteCar: () => void;
  onUpdateSpecs: (specs: TechnicalSpecs) => void; // Callback pour sauver les specs manuelles
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  car,
  invoices,
  aiStatus,
  onBackToGarage,
  onAddInvoice,
  onSellCar,
  onBuyCar,
  onAssistance,
  onDeleteCar,
  onUpdateSpecs
}) => {

  const [specs, setSpecs] = useState<ManufacturerSpecs | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(Notification.permission === 'granted');
  const [showTechSheet, setShowTechSheet] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false); // State pour basculer l'affichage de l'historique
  const hasNotifiedRef = useRef(false);

  // State local pour l'édition de la fiche technique
  const [techForm, setTechForm] = useState<TechnicalSpecs>({
    tireDimensions: car.specs?.tireDimensions || '',
    oilViscosity: car.specs?.oilViscosity || '',
    colorCode: car.specs?.colorCode || '',
    batteryRef: car.specs?.batteryRef || '',
    wiperRef: car.specs?.wiperRef || ''
  });

  const lastMileage = invoices.length > 0 ? Math.max(...invoices.map(i => i.km)) : car.initialKm;

  // Calcul Consommation
  const fuelInvoices = invoices.filter(i => i.type === 'fuel').sort((a, b) => a.km - b.km);
  let averageConsu = 0;
  if (fuelInvoices.length >= 2) {
    const minKm = fuelInvoices[0].km;
    const maxKm = fuelInvoices[fuelInvoices.length - 1].km;
    const relevantVolume = fuelInvoices.slice(1).reduce((acc, i) => acc + (i.volume || 0), 0);
    if (maxKm > minKm && relevantVolume > 0) {
      averageConsu = (relevantVolume / (maxKm - minKm)) * 100;
    }
  }

  // Tri et filtrage des factures (Plus récent en premier, limiter à 5 par défaut)
  const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedInvoices = showAllHistory ? sortedInvoices : sortedInvoices.slice(0, 5);

  useEffect(() => {
    const loadSpecs = async () => {
      setSpecs(null);
      const data = await getPersonalizedMaintenance(car, lastMileage);
      setSpecs(data);
    };
    loadSpecs();
  }, [car, lastMileage]);

  useEffect(() => {
    // Mettre à jour le formulaire quand la voiture change (ou que l'IA a mis à jour les specs)
    setTechForm({
        tireDimensions: car.specs?.tireDimensions || '',
        oilViscosity: car.specs?.oilViscosity || '',
        colorCode: car.specs?.colorCode || '',
        batteryRef: car.specs?.batteryRef || '',
        wiperRef: car.specs?.wiperRef || ''
    });
  }, [car]);

  useEffect(() => {
    const checkAndNotify = async () => {
      if (hasNotifiedRef.current) return;
      if (aiStatus.status === 'critical' || aiStatus.status === 'warning') {
        if (notifEnabled) {
          sendLocalNotification(`⚠️ Alerte NSP : ${car.name}`, `${aiStatus.message}`);
          hasNotifiedRef.current = true;
        }
      }
      if (averageConsu > 8.5 && car.fuelType === 'diesel') {
         if (notifEnabled) {
           setTimeout(() => sendLocalNotification(`⛽ Surconsommation Détectée`, `Votre moyenne est de ${averageConsu.toFixed(1)}L/100. Vérifiez la pression des pneus.`), 4000);
         }
      }
    };
    checkAndNotify();
  }, [aiStatus, specs, notifEnabled, car, averageConsu]);

  const toggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if (granted) {
      sendLocalNotification("Notifications Activées", "NSP Auto surveille votre véhicule en temps réel.");
    }
  };

  const saveTechSpecs = () => {
    onUpdateSpecs(techForm);
    setShowTechSheet(false);
  };

  return (
    <div className="min-h-screen bg-nsp-bg pb-24">
      {/* Header Navigation */}
      <header className="bg-nsp-card/90 backdrop-blur-md sticky top-0 z-40 border-b border-nsp-border px-4 py-4 flex items-center gap-4">
        <button 
          onClick={onBackToGarage}
          className="p-2 rounded-full bg-nsp-input hover:bg-nsp-primary hover:text-white text-nsp-sub transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
           <h2 className="text-lg font-bold text-white">{car.name}</h2>
           <p className="text-xs text-gray-500">Garage de {user.name}</p>
        </div>
        
        <button 
          onClick={toggleNotifications}
          className={`p-2 rounded-lg transition-colors ${notifEnabled ? 'text-nsp-success bg-green-900/20' : 'text-nsp-sub bg-nsp-input'}`}
        >
          {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>

        <button 
          onClick={onDeleteCar} 
          className="p-2 text-nsp-sub hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
        
        {/* Car Identité Visuelle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             {/* Plaque Style */}
             <div className="bg-white px-3 py-1 rounded border-2 border-gray-300 shadow-sm flex items-center gap-2">
                <div className="w-3 h-6 bg-blue-800 rounded-sm"></div>
                <span className="text-black font-bold font-mono text-lg tracking-wider">{car.plate}</span>
                <div className="w-3 h-6 bg-blue-800 rounded-sm relative"></div>
             </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-nsp-primary">{lastMileage.toLocaleString()} <span className="text-sm text-gray-500">km</span></div>
             <span className="text-xs text-gray-500 capitalize bg-nsp-input px-2 py-0.5 rounded">{car.fuelType}</span>
          </div>
        </div>

        {/* AI Mechanic Status */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all shadow-xl ${
          aiStatus.status === 'critical' ? 'border-red-600 bg-gradient-to-r from-red-950 to-black animate-pulse' :
          aiStatus.status === 'warning' ? 'border-nsp-warning/50 bg-gradient-to-r from-nsp-card to-yellow-900/10' : 
          aiStatus.status === 'success' ? 'border-nsp-success/50 bg-gradient-to-r from-nsp-card to-green-900/10' :
          'border-gray-600 bg-gradient-to-r from-nsp-card to-gray-900/50' // Neutral handling
        }`}>
          <div className="flex items-start gap-4 relative z-10">
            <div className={`p-3 rounded-full ${
              aiStatus.status === 'critical' ? 'bg-red-600 text-white' :
              aiStatus.status === 'warning' ? 'bg-nsp-warning/20 text-nsp-warning' : 
              aiStatus.status === 'success' ? 'bg-nsp-success/20 text-nsp-success' :
              'bg-gray-700 text-gray-300' // Neutral icon
            }`}>
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-1 ${
                aiStatus.status === 'critical' ? 'text-red-500' : 
                aiStatus.status === 'warning' ? 'text-nsp-warning' :
                aiStatus.status === 'success' ? 'text-nsp-success' :
                'text-white'
              }`}>
                {aiStatus.status === 'critical' ? 'ACTION REQUISE' : 
                 aiStatus.status === 'warning' ? 'ATTENTION REQUISE' : 
                 aiStatus.status === 'success' ? 'DIAGNOSTIC IA : OK' : 
                 'ANALYSE EN COURS'}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm">
                {aiStatus.message}
              </p>
            </div>
          </div>
        </div>

        {/* Consommation & Eco-Conduite Card (Visible only if data available) */}
        {averageConsu > 0 && (
           <div className="bg-nsp-card rounded-2xl border border-nsp-border p-5">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white font-bold flex items-center gap-2">
                    <Fuel size={18} className="text-blue-500" /> Suivi Carburant
                 </h3>
              </div>
              <div className="flex items-center gap-6">
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Moyenne</p>
                    <p className="text-2xl font-bold text-white">{averageConsu.toFixed(1)} <span className="text-sm font-normal text-gray-500">L/100km</span></p>
                 </div>
                 <div className="h-10 w-px bg-gray-700"></div>
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Tendance</p>
                    <p className="text-sm font-bold text-green-400 flex items-center gap-1"><TrendingUp size={16} /> Stable</p>
                 </div>
                 <div className="h-10 w-px bg-gray-700"></div>
                 <div>
                    <p className="text-xs text-nsp-sub mb-1">Coût estimé</p>
                    <p className="text-sm font-bold text-white">{(averageConsu * 1.85).toFixed(2)} € / 100km</p>
                 </div>
              </div>
           </div>
        )}

        {/* PRECONISATIONS IA - NOUVEAU DESIGN */}
        <div className="bg-nsp-card rounded-2xl border border-nsp-border p-5 space-y-4">
          <div className="flex justify-between items-center">
             <h3 className="text-white font-bold flex items-center gap-2">
                <Wrench size={18} className="text-nsp-primary" /> Préconisations Constructeur
             </h3>
             <button 
                onClick={() => setShowTechSheet(true)}
                className="text-xs bg-nsp-input hover:bg-nsp-primary hover:text-white text-nsp-sub px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
             >
                <ClipboardList size={14} /> Fiche Technique
             </button>
          </div>
          
          {specs ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Pression Pneus */}
                <div className="bg-nsp-input rounded-xl border-l-4 border-blue-500 p-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-2 opacity-10">
                    <Gauge size={64} />
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Pression</p>
                  <p className="text-lg font-bold text-white leading-tight">{specs.tirePressure}</p>
                  <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Vérifier à froid
                  </div>
                </div>

                {/* Huile Moteur */}
                <div className="bg-nsp-input rounded-xl border-l-4 border-yellow-500 p-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-2 opacity-10">
                    <Droplet size={64} />
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Huile Moteur</p>
                  <p className="text-lg font-bold text-white leading-tight">{specs.oilType}</p>
                  <div className="mt-2 text-[10px] text-yellow-500 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Norme Constructeur
                  </div>
                </div>
              </div>

              {/* Points de Vigilance - Liste */}
              <div className="bg-nsp-input rounded-xl border border-nsp-border p-4">
                 <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3 flex items-center gap-2">
                   <Activity size={14} className="text-nsp-primary" /> Points de Vigilance (Kilométrage)
                 </h4>
                 <div className="space-y-2">
                    {specs.checkPoints.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-nsp-bg/50 border border-nsp-border/30">
                         <div className="w-5 h-5 rounded-full bg-nsp-primary/20 text-nsp-primary flex items-center justify-center shrink-0">
                            <AlertTriangle size={12} />
                         </div>
                         <span className="text-sm text-gray-200">{cp}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8 gap-2 text-nsp-sub text-sm animate-pulse">
              <Sparkles size={16} /> Recherche des données constructeurs...
            </div>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onAssistance}
            className="col-span-2 bg-nsp-primary hover:bg-red-600 rounded-xl p-4 flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-900/20 group"
          >
            <Phone size={20} className="text-white" />
            <span className="font-bold text-white">ASSISTANCE & EXPERTS</span>
          </button>
          <button onClick={onSellCar} className="bg-nsp-card border border-nsp-border hover:border-nsp-primary/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
            <ArrowRightLeft size={20} className="text-nsp-primary" />
            <span className="font-bold text-white text-xs">Vendre Véhicule</span>
          </button>
          <button onClick={onBuyCar} className="bg-nsp-card border border-nsp-border hover:border-nsp-success/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
            <DownloadCloud size={20} className="text-nsp-success" />
            <span className="font-bold text-white text-xs">Importer Véhicule</span>
          </button>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-semibold text-white">Historique & Factures</h3>
            {sortedInvoices.length > 5 && (
              <button 
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="text-xs text-nsp-primary font-bold flex items-center gap-1 hover:text-white transition-colors"
              >
                {showAllHistory ? 'Voir moins' : `Voir tout (${invoices.length})`}
                {showAllHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="bg-nsp-input/30 rounded-xl p-8 border border-dashed border-nsp-border flex flex-col items-center text-center">
              <FileText className="text-nsp-sub opacity-50 mb-2" size={32} />
              <p className="text-nsp-sub text-sm">Aucune facture pour ce véhicule.</p>
              <p className="text-xs text-gray-600 mt-1">Ajoutez-en une pour affiner le diagnostic IA.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedInvoices.map((inv) => (
                <div key={inv.id} className={`bg-nsp-card p-4 rounded-xl border border-nsp-border flex items-center justify-between hover:border-nsp-primary transition-colors cursor-pointer ${inv.type === 'fuel' ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${inv.type === 'fuel' ? 'bg-blue-900/20 text-blue-400' : 'bg-nsp-input'}`}>
                      {inv.type === 'fuel' ? <Fuel size={20} /> : '🧾'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{inv.title}</h4>
                      <p className="text-xs text-nsp-sub">
                        {inv.date} • {inv.km.toLocaleString()} km
                        {inv.type === 'fuel' && inv.volume && <span className="text-blue-400 ml-2">• {inv.volume}L</span>}
                      </p>
                      {/* Indicateur si specs détectées */}
                      {inv.detectedSpecs && Object.keys(inv.detectedSpecs).length > 0 && (
                         <p className="text-[10px] text-purple-400 flex items-center gap-1 mt-1">
                           <Sparkles size={10} /> Données techniques extraites
                         </p>
                      )}
                    </div>
                  </div>
                  <div className={`${inv.type === 'fuel' ? 'text-blue-400' : 'text-nsp-success'} font-bold font-mono text-sm`}>
                    {inv.price} €
                  </div>
                </div>
              ))}
              
              {!showAllHistory && sortedInvoices.length > 5 && (
                 <div className="text-center pt-2">
                   <span className="text-xs text-gray-600 italic">... et {sortedInvoices.length - 5} autres documents</span>
                 </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL FICHE TECHNIQUE */}
      {showTechSheet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-nsp-card w-full max-w-md rounded-2xl border border-nsp-border p-6 space-y-6 animate-scale-up shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardList className="text-nsp-primary" /> Fiche Technique
              </h3>
              <button onClick={() => setShowTechSheet(false)} className="p-2 bg-nsp-input rounded-full text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-sm text-blue-300 flex items-start gap-3">
               <Sparkles className="shrink-0 mt-0.5" size={16} />
               <p>Ces données sont extraites automatiquement de vos factures par l'IA ou remplies manuellement. Elles aident à l'entretien.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Dimensions Pneus</label>
                <div className="relative">
                   <Gauge className="absolute left-3 top-3 text-nsp-sub" size={18} />
                   <input 
                     type="text" 
                     value={techForm.tireDimensions}
                     onChange={e => setTechForm({...techForm, tireDimensions: e.target.value})}
                     placeholder="Ex: 205/55 R16 91V"
                     className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Huile Moteur</label>
                <div className="relative">
                   <Droplet className="absolute left-3 top-3 text-nsp-sub" size={18} />
                   <input 
                     type="text" 
                     value={techForm.oilViscosity}
                     onChange={e => setTechForm({...techForm, oilViscosity: e.target.value})}
                     placeholder="Ex: 5W30 Synthétique"
                     className="w-full bg-nsp-input pl-10 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Code Couleur</label>
                  <input 
                    type="text" 
                    value={techForm.colorCode}
                    onChange={e => setTechForm({...techForm, colorCode: e.target.value})}
                    placeholder="Ex: EWP"
                    className="w-full bg-nsp-input px-3 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-nsp-sub mb-1 uppercase">Batterie</label>
                  <input 
                    type="text" 
                    value={techForm.batteryRef}
                    onChange={e => setTechForm({...techForm, batteryRef: e.target.value})}
                    placeholder="Ex: 70Ah 640A"
                    className="w-full bg-nsp-input px-3 rounded-lg py-2.5 text-white focus:border-nsp-primary border border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={saveTechSpecs}
              className="w-full bg-nsp-primary hover:bg-red-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} /> ENREGISTRER LA FICHE
            </button>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button 
          onClick={onAddInvoice}
          className="bg-nsp-primary hover:bg-red-600 text-white w-14 h-14 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};
