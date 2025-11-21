
import { Car } from '../types';

interface SIVResult {
  make: string;
  model: string;
  version: string;
  firstRegistrationDate: string;
  fuelType: Car['fuelType'];
  type: 'car' | 'motorcycle';
}

// Mock Data for specific plates to demonstrate specific cases
const MOCK_DB: Record<string, SIVResult> = {
  'AA-007-JB': {
    make: 'Aston Martin',
    model: 'DB11',
    version: 'V12 AMR',
    firstRegistrationDate: '2019-03-15',
    fuelType: 'essence',
    type: 'car'
  },
  'AB-123-CD': {
    make: 'Renault',
    model: 'Clio V',
    version: '1.0 TCe 100',
    firstRegistrationDate: '2021-06-20',
    fuelType: 'essence',
    type: 'car'
  },
  'TES-555-LA': {
    make: 'Tesla',
    model: 'Model 3',
    version: 'Performance',
    firstRegistrationDate: '2022-01-10',
    fuelType: 'electrique',
    type: 'car'
  },
  'MT-090-YZ': {
    make: 'Yamaha',
    model: 'MT-09',
    version: 'SP',
    firstRegistrationDate: '2023-04-12',
    fuelType: 'essence',
    type: 'motorcycle'
  }
};

export const searchVehicleByPlate = async (plate: string): Promise<SIVResult> => {
  // Simulate Network Delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const cleanPlate = plate.replace(/-/g, '').toUpperCase();
  
  // Check Mock DB (trying with and without dashes logic simplified here)
  // For the demo, we check if the input loosely matches our keys
  const mockKey = Object.keys(MOCK_DB).find(k => k.replace(/-/g, '') === cleanPlate);
  
  if (mockKey) {
    return MOCK_DB[mockKey];
  }

  // Random generator for unknown plates to simulate a working system
  const isMoto = Math.random() > 0.8;
  if (isMoto) {
     return {
        make: 'Honda',
        model: 'X-ADV',
        version: '750',
        firstRegistrationDate: '2022-05-15',
        fuelType: 'essence',
        type: 'motorcycle'
     };
  }

  return {
    make: 'Peugeot',
    model: '3008',
    version: 'BlueHDi 130',
    firstRegistrationDate: '2020-09-01',
    fuelType: 'diesel',
    type: 'car'
  };
};
