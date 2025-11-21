
import React, { useState, useRef } from 'react';
import { Invoice, TechnicalSpecs } from '../types';
import { Camera, Loader2, X, Check, FileText, Upload, Fuel, Wrench, ScanLine, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeInvoiceImage, fileToGenerativePart } from '../services/geminiService';

interface AddInvoiceScreenProps {
  carId: string;
  onSave: (invoice: Invoice, detectedSpecs?: TechnicalSpecs) => void;
  onCancel: () => void;
}

export const AddInvoiceScreen: React.FC<AddInvoiceScreenProps> = ({ carId, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'fuel'>('maintenance');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>(''); // 'image' or 'pdf'
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoSwitchMessage, setAutoSwitchMessage] = useState<string | null>(null);

  // Detected specs to pass up
  const [detectedSpecs, setDetectedSpecs] = useState<TechnicalSpecs | undefined>(undefined);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    km: '',
    price: '',
    volume: ''
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 1. Determine type and preview
      const isPdf = file.type === 'application/pdf';
      setFileType(isPdf ? 'pdf' : 'image');
      setFileName(file.name);
      setAutoSwitchMessage(null);

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsAnalyzing(true);
      setDetectedSpecs(undefined);

      try {
        // 2. Convert to Base64 for Gemini
        const base64Data = await fileToGenerativePart(file);
        
        // 3. Call Gemini (handles both Image and PDF)
        const result = await analyzeInvoiceImage(base64Data, file.type);
        
        // 4. Auto-fill Form & Switch Tab if needed
        if (result.type === 'fuel' && activeTab !== 'fuel') {
          setActiveTab('fuel');
          setAutoSwitchMessage("Ticket carburant détecté : Mode Carburant activé");
        } else if (result.type === 'maintenance' && activeTab !== 'maintenance') {
          setActiveTab('maintenance');
        }

        setFormData({
          title: result.title || (result.type === 'fuel' ? 'Station Service' : 'Entretien Divers'),
          date: result.date || new Date().toISOString().split('T')[0],
          km: result.km?.toString() || '',
          price: result.price?.toString() || '',
          volume: result.volume?.toString() || ''
        });

        // 5. Store detected specs if any
        if (result.specs) {
           setDetectedSpecs(result.specs);
        }

      } catch (error) {
        console.error("Error processing invoice", error);
        alert("Erreur lors de l'analyse. Veuillez remplir manuellement.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = () => {
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      carId: carId,
      type: activeTab,
      title: formData.title || (activeTab === 'fuel' ? 'Plein Carburant' : 'Entretien'),
      date: formData.date,
      km: parseInt(formData.km) || 0,
      price: parseFloat(formData.price) || 0,
      volume: activeTab === 'fuel' ? parseFloat(formData.volume) || 0 : undefined,
      imageUrl: fileType === 'image' ? imagePreview || undefined : undefined,
      detectedSpecs: detectedSpecs // Attach specs to invoice history
    };
    onSave(newInvoice, detectedSpecs);
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setFileType('');
    setFileName('');
    setDetectedSpecs(undefined);
    setAutoSwitchMessage(null);
    setFormData({title: '', date: '', km: '', price: '', volume: ''});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-nsp-bg flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-nsp-card border-b border-nsp-border">
        <button onClick={onCancel} className="text-nsp-sub hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-lg font-bold text-white">Ajouter Document</h2>
        <div className="w-6"></div>
      </div>

      {/* Type Tabs */}
      <div className="flex p-4 gap-4">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
            activeTab === 'maintenance' 
              ? 'bg-nsp-primary border-nsp-primary text-white shadow-lg' 
              : 'bg-nsp-input border-transparent text-gray-500'
          }`}
        >
          <Wrench size={18} /> Entretien
        </button>
        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
            activeTab === 'fuel' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-nsp-input border-transparent text-gray-500'
          }`}
        >
          <Fuel size={18} /> Carburant
        </button>
      </div>

      <div className="flex-1 p-6 pt-0 overflow-y-auto max-w-2xl mx-auto w-full">
        
        {/* Camera / Upload Area */}
        <div 
          className={`relative w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center mb-4 overflow-hidden transition-colors ${
            imagePreview 
              ? 'border-nsp-primary bg-black' 
              : activeTab === 'fuel' 
                ? 'border-blue-500/50 bg-blue-900/10 hover:border-blue-400'
                : 'border-nsp-border bg-nsp-input hover:border-nsp-sub'
          } cursor-pointer`}
          onClick={() => !imagePreview && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <>
              {fileType === 'pdf' ? (
                <div className="flex flex-col items-center justify-center text-white opacity-80">
                  <FileText size={64} className="text-red-500 mb-2" />
                  <p className="font-bold text-lg">Document PDF</p>
                  <p className="text-sm text-gray-400">{fileName}</p>
                </div>
              ) : (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain opacity-50" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {isAnalyzing ? (
                   <div className="text-center space-y-2 bg-black/60 p-4 rounded-xl backdrop-blur-sm">
                     <Loader2 size={48} className="text-nsp-primary animate-spin mx-auto" />
                     <p className="text-white font-bold text-shadow">Lecture IA en cours...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-2 items-center">
                     <div className="bg-nsp-success/20 text-nsp-success px-4 py-2 rounded-full border border-nsp-success/50 flex items-center gap-2 backdrop-blur-md">
                       <Check size={16} /> Analyse terminée
                     </div>
                     {detectedSpecs && Object.keys(detectedSpecs).length > 0 && (
                       <div className="bg-purple-900/80 text-purple-300 px-3 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-md border border-purple-500/30">
                         <Sparkles size={12} /> Données techniques extraites
                       </div>
                     )}
                   </div>
                 )}
              </div>
              <button 
                onClick={resetUpload}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-nsp-primary transition-colors pointer-events-auto"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${activeTab === 'fuel' ? 'bg-blue-900/30 border-blue-500/30' : 'bg-nsp-card border-nsp-border'}`}>
                  {activeTab === 'fuel' ? <Fuel size={24} className="text-blue-400" /> : <Camera size={24} className="text-nsp-primary" />}
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${activeTab === 'fuel' ? 'bg-blue-900/30 border-blue-500/30' : 'bg-nsp-card border-nsp-border'}`}>
                  <Upload size={24} className={activeTab === 'fuel' ? "text-blue-400" : "text-nsp-primary"} />
                </div>
              </div>
              <p className="text-white font-semibold">
                {activeTab === 'fuel' ? 'Scanner Ticket Carburant' : 'Photo ou Fichier PDF'}
              </p>
              <p className="text-sm text-nsp-sub mt-1">
                {activeTab === 'fuel' ? 'Scanner pour extraire Litres & Prix' : 'Scanner ou importer un document'}
              </p>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf" 
            onChange={handleFileChange} 
          />
        </div>

        {autoSwitchMessage && (
          <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex items-center gap-2 animate-fade-in">
             <Check size={16} className="text-blue-400" />
             <p className="text-xs text-blue-200">{autoSwitchMessage}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5 animate-slide-up">
          {detectedSpecs && (
            <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl mb-4">
              <p className="text-xs text-purple-300 font-bold mb-2 uppercase flex items-center gap-1">
                 <Sparkles size={12} /> L'IA a appris sur votre véhicule :
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                {detectedSpecs.tireDimensions && <div>Pneus : <span className="text-white">{detectedSpecs.tireDimensions}</span></div>}
                {detectedSpecs.oilViscosity && <div>Huile : <span className="text-white">{detectedSpecs.oilViscosity}</span></div>}
                {detectedSpecs.batteryRef && <div>Batterie : <span className="text-white">{detectedSpecs.batteryRef}</span></div>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-nsp-sub mb-2">
              {activeTab === 'fuel' ? 'Station Service' : "Titre de l'intervention"}
            </label>
            <input 
              type="text" 
              className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${activeTab === 'fuel' ? 'focus:border-blue-500' : 'focus:border-nsp-primary'}`}
              placeholder={activeTab === 'fuel' ? "Ex: Total Access" : "Ex: Vidange, Pneus..."}
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-nsp-sub mb-2">Kilométrage</label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="decimal"
                  className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${activeTab === 'fuel' ? 'focus:border-blue-500' : 'focus:border-nsp-primary'}`}
                  placeholder="120000"
                  value={formData.km}
                  onChange={(e) => setFormData({...formData, km: e.target.value})}
                />
                <span className="absolute right-4 top-3 text-nsp-sub">km</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-nsp-sub mb-2">Prix Total</label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${activeTab === 'fuel' ? 'focus:border-blue-500' : 'focus:border-nsp-primary'}`}
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
                <span className="absolute right-4 top-3 text-nsp-sub">€</span>
              </div>
            </div>
          </div>

          {activeTab === 'fuel' && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 animate-fade-in">
              <label className="block text-sm font-medium text-blue-200 mb-2 flex items-center gap-2">
                 <Fuel size={16}/> Volume Carburant
              </label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-full bg-nsp-input border border-transparent focus:border-blue-500 rounded-lg px-4 py-3 text-white focus:outline-none transition-colors"
                  placeholder="Ex: 45.5"
                  value={formData.volume}
                  onChange={(e) => setFormData({...formData, volume: e.target.value})}
                />
                <span className="absolute right-4 top-3 text-blue-300 font-bold">Litres</span>
              </div>
              <p className="text-xs text-blue-300 mt-2">Permet à l'IA de calculer votre consommation réelle.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-nsp-sub mb-2">Date</label>
            <input 
              type="date" 
              className={`w-full bg-nsp-input border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none transition-colors [color-scheme:dark] ${activeTab === 'fuel' ? 'focus:border-blue-500' : 'focus:border-nsp-primary'}`}
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>

        <div className="h-24"></div> {/* Scroll spacer */}
      </div>

      {/* Bottom Actions */}
      <div className="p-6 bg-nsp-card border-t border-nsp-border">
        <button 
          onClick={handleSubmit}
          className={`w-full font-bold py-4 rounded-xl transition-all transform active:scale-95 ${
            activeTab === 'fuel' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20' 
            : 'bg-nsp-primary hover:bg-red-600 text-white shadow-lg shadow-red-900/20'
          }`}
        >
          {activeTab === 'fuel' ? 'AJOUTER LE PLEIN' : 'SAUVEGARDER LE DOCUMENT'}
        </button>
      </div>
    </div>
  );
};
