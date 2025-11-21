
import React, { useState, useRef } from 'react';
import { Car } from '../types';
import { Camera, CheckCircle2, FileText, Gauge, Car as CarIcon, Activity, Bike, AlertCircle, Plus, ArrowLeft, Search, Loader2, Trash2, Edit2, ImagePlus, ScanLine } from 'lucide-react';
import { searchVehicleByPlate } from '../services/sivService';

interface OnboardingScreenProps {
  onSave: (car: Car) => void;
  onCancel?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  
  // Identité
  const [carName, setCarName] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');
  const [plate, setPlate] = useState('');
  const [firstRegDate, setFirstRegDate] = useState('');
  
  // SIV Loading State
  const [isSearchingSIV, setIsSearchingSIV] = useState(false);
  const [sivFound, setSivFound] = useState(false);
  const [sivError, setSivError] = useState<string | null>(null);
  
  // Technique & État
  const [initialKm, setInitialKm] = useState('');
  const [fuelType, setFuelType] = useState<Car['fuelType']>('diesel');
  
  // Etats Détaillés
  const [tiresState, setTiresState] = useState<Car['initialState']['tires']>('good');
  const [brakesState, setBrakesState] = useState<Car['initialState']['brakes']>('good');
  const [bodyState, setBodyState] = useState<Car['initialState']['body']>('good');
  const [interiorState, setInteriorState] = useState<Car['initialState']['interior']>('good');
  const [engineState, setEngineState] = useState<Car['initialState']['engine']>('good');

  // Photos
  const [grayCard, setGrayCard] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Car['photos']>({
    front: null,
    back: null,
    left: null,
    right: null,
    engine: null,
    damages: []
  });

  // Refs pour les inputs fichiers
  const grayCardInputRef = useRef<HTMLInputElement>(null);
  const carPhotoInputRef = useRef<HTMLInputElement>(null);
  const enginePhotoInputRef = useRef<HTMLInputElement>(null);
  const damagePhotoInputRef = useRef<HTMLInputElement>(null);
  
  // Pour savoir quel angle on upload
  const [currentAngle, setCurrentAngle] = useState<keyof Car['photos'] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'car' | 'grayCard' | 'damage' | 'engine') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'grayCard') {
          setGrayCard(result);
        } else if (type === 'engine') {
           setPhotos(prev => ({ ...prev, engine: result }));
        } else if (type === 'damage') {
           setPhotos(prev => ({ ...prev, damages: [...prev.damages, result] }));
        } else if (type === 'car' && currentAngle) {
           setPhotos(prev => ({ ...prev, [currentAngle]: result }));
           setCurrentAngle(null);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow re-uploading the same file if needed
    e.target.value = ''; 
  };

  const triggerUpload = (type: 'car' | 'grayCard' | 'damage' | 'engine', angle?: keyof Car['photos']) => {
    if (type === 'car' && angle) {
      setCurrentAngle(angle);
      carPhotoInputRef.current?.click();
    } else if (type === 'grayCard') {
      grayCardInputRef.current?.click();
    } else if (type === 'engine') {
      enginePhotoInputRef.current?.click();
    } else if (type === 'damage') {
      damagePhotoInputRef.current?.click();
    }
  };

  const removeDamagePhoto = (index: number) => {
    setPhotos(prev => ({
      ...prev,
      damages: prev.damages.filter((_, i) => i !== index)
    }));
  };

  const formatPlate = (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlate(cleaned);
    setSivFound(false); 
    setSivError(null);
  };

  const handleSIVSearch = async () => {
    if (plate.length < 4) return;
    setIsSearchingSIV(true);
    setSivError(null);
    
    try {
      const result = await searchVehicleByPlate(plate);
      if (result) {
        setCarName(`${result.make} ${result.model} ${result.version}`);
        setVehicleType(result.type);
        setFirstRegDate(result.firstRegistrationDate);
        setFuelType(result.fuelType);
        setSivFound(true);
      } else {
        setSivError("Véhicule non trouvé. Remplissez manuellement.");
      }
    } catch (error) {
      console.error("SIV Error", error);
      setSivError("Erreur de connexion SIV.");
    } finally {
      setIsSearchingSIV(false);
    }
  };

  const isStep1Valid = plate.length >= 2 && firstRegDate !== '' && carName !== '';
  const isStep2Valid = initialKm !== '';
  const isStep3Valid = grayCard !== null && photos.front !== null && photos.back !== null;

  const renderStep1 = () => (
    <div className="space-y-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-white border-b border-nsp-border pb-2">1. Identité du Véhicule</h3>
      
      <div>
        <label className="block text-sm font-medium text-nsp-sub mb-2">Immatriculation (SIV)</label>
        <div className="flex items-center gap-3">
          {/* Plaque compacte */}
          <div className="flex-1 flex h-12 shadow-lg transform transition-transform relative max-w-[280px]">
            <div className="w-8 bg-[#003399] rounded-l-md flex flex-col items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <input 
              type="text"
              value={plate}
              onChange={(e) => formatPlate(e.target.value)}
              maxLength={9}
              placeholder="AB-123-CD"
              className="flex-1 bg-white text-black font-mono text-xl font-bold text-center focus:outline-none uppercase tracking-wider placeholder-gray-300"
            />
            <div className="w-8 bg-[#003399] rounded-r-md flex flex-col items-center justify-center relative">
              <div className="text-white text-[6px] absolute top-1">TP</div>
              <span className="text-white font-bold text-sm mt-2">75</span>
            </div>
          </div>

          {/* Bouton Recherche bien visible */}
          <button 
            onClick={handleSIVSearch}
            disabled={isSearchingSIV || plate.length < 4}
            className="h-12 w-12 flex-none bg-nsp-primary disabled:bg-nsp-input disabled:text-gray-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          >
            {isSearchingSIV ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          </button>
        </div>
        
        {sivFound && (
          <div className="mt-2 text-green-400 text-xs font-bold flex items-center gap-1 animate-fade-in">
            <CheckCircle2 size={14} /> Véhicule identifié : Données remplies !
          </div>
        )}
        {sivError && (
          <div className="mt-2 text-red-400 text-xs font-bold flex items-center gap-1 animate-fade-in">
            <AlertCircle size={14} /> {sivError}
          </div>
        )}
      </div>

      {/* Type Select */}
      <div className="flex gap-4">
        <button 
          onClick={() => setVehicleType('car')}
          className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${vehicleType === 'car' ? 'bg-nsp-primary border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
        >
          <CarIcon size={24} /> <span className="text-sm font-bold">Auto</span>
        </button>
        <button 
          onClick={() => setVehicleType('motorcycle')}
          className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${vehicleType === 'motorcycle' ? 'bg-nsp-primary border-nsp-primary text-white' : 'bg-nsp-input border-transparent text-gray-500'}`}
        >
          <Bike size={24} /> <span className="text-sm font-bold">Moto</span>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-nsp-sub mb-2">Nom du véhicule</label>
        <input 
          type="text"
          value={carName}
          onChange={(e) => setCarName(e.target.value)}
          placeholder="Ex: Ma Clio, La BMW, T-Max..."
          className={`w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white focus:outline-none ${sivFound ? 'border-green-500/50 text-green-400' : ''}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-nsp-sub mb-2">Date de 1ère mise en circulation</label>
        <input 
          type="date"
          value={firstRegDate}
          onChange={(e) => setFirstRegDate(e.target.value)}
          className={`w-full bg-nsp-input border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white focus:outline-none transition-colors [color-scheme:dark] ${sivFound ? 'border-green-500/50 text-green-400' : ''}`}
        />
      </div>
      <button onClick={() => setStep(2)} disabled={!isStep1Valid} className={`w-full py-4 rounded-xl font-bold mt-4 ${isStep1Valid ? 'bg-nsp-primary text-white' : 'bg-nsp-input text-gray-500'}`}>SUIVANT</button>
    </div>
  );

  const StateSelector = ({ label, value, onChange }: { label: string, value: string, onChange: (v: any) => void }) => (
    <div className="flex items-center justify-between bg-nsp-input/50 p-3 rounded-lg border border-nsp-border/30">
      <span className="text-white text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        <button onClick={() => onChange('bad')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'bad' ? 'bg-red-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Mauvais</button>
        <button onClick={() => onChange('average')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'average' ? 'bg-orange-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Moyen</button>
        <button onClick={() => onChange('good')} className={`px-3 py-1.5 text-xs rounded font-bold ${value === 'good' ? 'bg-green-500 text-white' : 'bg-nsp-card text-gray-500'}`}>Bon</button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-white border-b border-nsp-border pb-2">2. Bilan de Santé Complet</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-nsp-sub mb-2">Kilométrage Actuel</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Gauge className="text-nsp-primary" size={20} />
            </div>
            <input 
              type="number"
              value={initialKm}
              onChange={(e) => setInitialKm(e.target.value)}
              placeholder="Ex: 125000"
              className="w-full bg-nsp-input pl-10 border border-transparent focus:border-nsp-primary rounded-lg px-4 py-3 text-white focus:outline-none"
            />
          </div>
        </div>
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-nsp-sub mb-2">Carburant</label>
          <div className="grid grid-cols-4 gap-2">
            {(['diesel', 'essence', 'hybride', 'electrique'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFuelType(type)}
                className={`py-2 rounded-lg border text-xs capitalize font-bold ${fuelType === type ? 'bg-nsp-primary border-nsp-primary text-white' : 'bg-nsp-input border-nsp-border text-gray-400'}`}
              >
                {type.slice(0,4)}.
              </button>
            ))}
          </div>
          {sivFound && (
             <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 size={10}/> Rempli par SIV</p>
          )}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <p className="text-nsp-sub text-xs uppercase tracking-wider mb-2">État des organes</p>
        <StateSelector label="Pneus" value={tiresState} onChange={setTiresState} />
        <StateSelector label="Freins" value={brakesState} onChange={setBrakesState} />
        <StateSelector label="Moteur" value={engineState} onChange={setEngineState} />
        <StateSelector label="Intérieur" value={interiorState} onChange={setInteriorState} />
        <StateSelector label="Carrosserie" value={bodyState} onChange={setBodyState} />
      </div>

      {bodyState === 'bad' && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-xs text-red-200">Carrosserie signalée abîmée. Préparez vos photos.</p>
        </div>
      )}

      <button onClick={() => setStep(3)} disabled={!isStep2Valid} className={`w-full py-4 rounded-xl font-bold mt-4 ${isStep2Valid ? 'bg-nsp-primary text-white' : 'bg-nsp-input text-gray-500'}`}>SUIVANT</button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-slide-up">
      <h3 className="text-lg font-semibold text-white border-b border-nsp-border pb-2">3. Certification Photos</h3>
      
      {/* Inputs Masqués */}
      <input type="file" ref={grayCardInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'grayCard')} />
      <input type="file" ref={carPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'car')} />
      <input type="file" ref={enginePhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'engine')} />
      <input type="file" ref={damagePhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'damage')} />

      {/* Carte Grise */}
      <div>
        <label className="block text-sm font-medium text-nsp-sub mb-2">Carte Grise (Obligatoire)</label>
        <button
          onClick={() => triggerUpload('grayCard')}
          className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all relative overflow-hidden ${grayCard ? 'border-nsp-success bg-nsp-card' : 'border-nsp-primary bg-nsp-input'}`}
        >
          {grayCard ? (
            <>
              <img src={grayCard} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <span className="text-white font-bold flex items-center gap-2 relative z-10"><CheckCircle2 size={16}/> Carte Grise Enregistrée</span>
              <div className="absolute right-2 top-2 p-1 bg-black/50 rounded-full text-white"><Edit2 size={12} /></div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-white">
              <ScanLine size={20} />
              <span className="text-sm font-bold">Scanner ou Importer Carte Grise</span>
            </div>
          )}
        </button>
      </div>

      {/* PHOTOS 4 ANGLES - GRID */}
      <div>
        <p className="text-xs text-nsp-sub uppercase tracking-wider mb-2 flex justify-between">
          <span>Extérieur (4 Angles)</span>
          <span className="text-gray-500">{Object.keys(photos).filter(k => ['front','back','left','right'].includes(k) && photos[k as keyof Car['photos']]).length}/4</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['front', 'back', 'left', 'right'] as const).map((angle) => (
            <button
              key={angle}
              onClick={() => triggerUpload('car', angle)}
              className={`aspect-[4/3] rounded-xl border border-dashed flex flex-col items-center justify-center relative overflow-hidden group transition-all ${photos[angle] ? 'border-nsp-success bg-nsp-card' : 'border-nsp-border bg-nsp-input'}`}
            >
              {photos[angle] ? (
                <>
                  <img src={photos[angle]!} alt={angle} className="absolute inset-0 w-full h-full object-cover" />
                  {/* Overlay Modifier */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-black/50 p-2 rounded-full text-white border border-white/30">
                       <Edit2 size={20} />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white uppercase font-bold">{angle}</div>
                </>
              ) : (
                <>
                  <Camera size={20} className="text-nsp-sub mb-1" />
                  <span className="text-nsp-sub text-[10px] uppercase">{angle}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MOTEUR */}
      <div>
        <p className="text-xs text-nsp-sub uppercase tracking-wider mb-2">Compartiment Moteur</p>
        <button
            onClick={() => triggerUpload('engine')}
            className={`w-full aspect-[21/9] rounded-xl border border-dashed flex flex-col items-center justify-center relative overflow-hidden group ${photos.engine ? 'border-nsp-success bg-nsp-card' : 'border-nsp-border bg-nsp-input'}`}
          >
            {photos.engine ? (
              <>
                <img src={photos.engine!} alt="Moteur" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-black/50 p-2 rounded-full text-white border border-white/30">
                       <Edit2 size={20} />
                    </div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white uppercase font-bold flex items-center gap-1"><Activity size={12}/> Moteur</div>
              </>
            ) : (
              <>
                <Activity size={24} className="text-nsp-primary mb-2" />
                <span className="text-nsp-sub text-xs uppercase">Ajouter Photo Moteur</span>
              </>
            )}
        </button>
      </div>

      {/* DOMMAGES & RAYURES - SECTION DÉDIÉE */}
      <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-red-200 font-bold uppercase tracking-wider flex items-center gap-2">
             <AlertCircle size={12} /> Inspection Dégâts
          </p>
          <span className="text-[10px] text-red-300 bg-red-900/50 px-2 py-0.5 rounded-full">{photos.damages.length} Photos</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
           {/* Liste des dégâts existants */}
           {photos.damages.map((dmg, idx) => (
             <div key={idx} className="aspect-square rounded-lg relative overflow-hidden border border-red-500/30 group">
                <img src={dmg} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeDamagePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                >
                  <Trash2 size={12} />
                </button>
             </div>
           ))}

           {/* Bouton Ajouter Dégât */}
           <button
             onClick={() => triggerUpload('damage')}
             className="aspect-square rounded-lg border-2 border-dashed border-red-500/30 bg-red-500/5 flex flex-col items-center justify-center hover:bg-red-500/10 transition-colors text-red-400"
           >
             <ImagePlus size={20} className="mb-1" />
             <span className="text-[9px] font-bold uppercase">Ajouter</span>
           </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 italic">Ajoutez des photos si la carrosserie présente des rayures ou chocs.</p>
      </div>

      <button
        onClick={() => onSave({ 
          id: Date.now().toString(),
          ownerId: '', 
          name: carName,
          type: vehicleType,
          plate, 
          firstRegistrationDate: firstRegDate, 
          fuelType,
          initialKm: parseInt(initialKm),
          grayCardUrl: grayCard, 
          photos,
          initialState: { 
            tires: tiresState, 
            brakes: brakesState,
            body: bodyState,
            interior: interiorState,
            engine: engineState
          }
        })}
        disabled={!isStep3Valid}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl mt-6 ${isStep3Valid ? 'bg-nsp-primary hover:bg-red-600 text-white' : 'bg-nsp-input text-nsp-sub cursor-not-allowed'}`}
      >
        ENTRER AU GARAGE
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-nsp-bg p-4 md:p-8 flex flex-col items-center relative">
      {onCancel && (
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 md:left-8 z-20 flex items-center gap-2 text-nsp-sub hover:text-white bg-nsp-card/50 px-3 py-2 rounded-full backdrop-blur-sm border border-nsp-border hover:border-nsp-primary transition-all"
        >
          <ArrowLeft size={18} /> 
          <span className="text-sm font-bold">Retour Dashboard</span>
        </button>
      )}
      
      <div className="w-full max-w-2xl pb-20 mt-12 md:mt-0">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold text-white">Ajout Véhicule</h2>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`h-1 w-8 rounded ${step >= 1 ? 'bg-nsp-primary' : 'bg-nsp-input'}`} />
            <div className={`h-1 w-8 rounded ${step >= 2 ? 'bg-nsp-primary' : 'bg-nsp-input'}`} />
            <div className={`h-1 w-8 rounded ${step >= 3 ? 'bg-nsp-primary' : 'bg-nsp-input'}`} />
          </div>
        </div>

        <div className="bg-nsp-card p-6 rounded-xl border border-nsp-border">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};
