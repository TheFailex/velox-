export interface VehicleMake {
  name: string;
  models: string[];
}

export const VEHICLE_MAKES: VehicleMake[] = [
  {
    name: 'Audi',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S8', 'e-tron', 'e-tron GT', 'Q4 e-tron'],
  },
  {
    name: 'BMW',
    models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z4', 'M2', 'M3', 'M4', 'M5', 'M8', 'iX', 'i4', 'i5', 'i7'],
  },
  {
    name: 'Mercedes-Benz',
    models: ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'G-Class', 'AMG GT', 'EQA', 'EQB', 'EQC', 'EQS', 'SL', 'SLC', 'V-Class', 'Sprinter'],
  },
  {
    name: 'Volkswagen',
    models: ['Polo', 'Golf', 'Jetta', 'Passat', 'Arteon', 'Tiguan', 'Touareg', 'T-Roc', 'T-Cross', 'Taos', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Touran', 'Sharan', 'Caddy', 'Amarok', 'Transporter'],
  },
  {
    name: 'Ford',
    models: ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Mustang Mach-E', 'Kuga', 'Puma', 'EcoSport', 'Explorer', 'Edge', 'Bronco', 'F-150', 'Ranger', 'Galaxy', 'S-Max', 'Transit', 'Tourneo'],
  },
  {
    name: 'Toyota',
    models: ['Yaris', 'Yaris Cross', 'Corolla', 'Camry', 'Avalon', 'RAV4', 'C-HR', 'Highlander', 'Land Cruiser', 'Hilux', 'Prius', 'Prius Plus', 'GR86', 'GR Yaris', 'Supra', 'Aygo X', 'bZ4X', 'Proace'],
  },
  {
    name: 'Honda',
    models: ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'ZR-V', 'Pilot', 'Ridgeline', 'NSX', 'Civic Type R', 'e', 'e:Ny1'],
  },
  {
    name: 'Nissan',
    models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Navara', 'Leaf', 'Ariya', 'GT-R', '370Z', 'Z', 'Murano', 'Pathfinder', 'Kicks', 'Armada'],
  },
  {
    name: 'Hyundai',
    models: ['i10', 'i20', 'i30', 'i30 N', 'i20 N', 'Tucson', 'Santa Fe', 'Kona', 'Kona Electric', 'Ioniq 5', 'Ioniq 6', 'NEXO', 'Veloster N', 'Bayon'],
  },
  {
    name: 'Kia',
    models: ['Picanto', 'Rio', "Ceed", "ProCeed", 'Stinger', 'Sportage', 'Sorento', 'Telluride', 'EV6', 'EV9', 'Niro', 'Soul', 'Carnival'],
  },
  {
    name: 'Seat',
    models: ['Ibiza', 'Arona', 'Leon', 'Ateca', 'Tarraco', 'Alhambra', 'Mii'],
  },
  {
    name: 'Cupra',
    models: ['Born', 'Formentor', 'Ateca', 'Leon', 'Tavascan'],
  },
  {
    name: 'Skoda',
    models: ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Citigo'],
  },
  {
    name: 'Peugeot',
    models: ['108', '208', '308', '408', '508', '2008', '3008', '5008', 'Rifter', 'Traveller', 'Partner', 'Expert', 'e-208', 'e-2008'],
  },
  {
    name: 'Renault',
    models: ['Clio', 'Megane', 'Laguna', 'Talisman', 'Zoe', 'Captur', 'Kadjar', 'Koleos', 'Arkana', 'Austral', 'Kangoo', 'Espace', 'Scenic'],
  },
  {
    name: 'Citroën',
    models: ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'Spacetourer', 'ë-C4', 'ë-Berlingo'],
  },
  {
    name: 'Opel',
    models: ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland', 'Mokka', 'Combo', 'Zafira', 'Agila'],
  },
  {
    name: 'Fiat',
    models: ['500', '500X', '500L', 'Panda', 'Tipo', 'Bravo', 'Punto', 'Doblo', '500e', 'Freemont'],
  },
  {
    name: 'Alfa Romeo',
    models: ['Giulia', 'Stelvio', 'Tonale', 'Giulietta', '4C', 'GTV', '156', '147', '159'],
  },
  {
    name: 'Ferrari',
    models: ['296 GTB', '296 GTS', 'F8 Tributo', 'F8 Spider', 'Roma', 'Roma Spider', 'SF90 Stradale', 'SF90 Spider', 'Portofino M', '812 Superfast', '812 GTS', 'Purosangue', 'LaFerrari'],
  },
  {
    name: 'Lamborghini',
    models: ['Huracán', 'Huracán STO', 'Huracán Tecnica', 'Urus', 'Urus S', 'Urus Performante', 'Revuelto'],
  },
  {
    name: 'Porsche',
    models: ['911 Carrera', '911 Targa', '911 Turbo', '911 GT3', '911 GT3 RS', 'Boxster', 'Cayman', 'Cayenne', 'Cayenne Turbo', 'Macan', 'Panamera', 'Taycan', 'Taycan Cross Turismo'],
  },
  {
    name: 'Tesla',
    models: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
  },
  {
    name: 'Volvo',
    models: ['S60', 'S90', 'V40', 'V60', 'V60 Cross Country', 'V90', 'V90 Cross Country', 'XC40', 'XC60', 'XC90', 'C40 Recharge', 'EX30', 'EX90'],
  },
  {
    name: 'Land Rover',
    models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'],
  },
  {
    name: 'Jaguar',
    models: ['E-Pace', 'F-Pace', 'I-Pace', 'F-Type', 'XE', 'XF', 'XJ'],
  },
  {
    name: 'Jeep',
    models: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Renegade', 'Compass', 'Avenger', 'Gladiator'],
  },
  {
    name: 'Subaru',
    models: ['Impreza', 'WRX', 'WRX STI', 'BRZ', 'Forester', 'Outback', 'XV / Crosstrek', 'Legacy', 'Ascent', 'Solterra'],
  },
  {
    name: 'Mazda',
    models: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-80', 'MX-5', 'MX-30', 'RX-8'],
  },
  {
    name: 'Mitsubishi',
    models: ['Colt', 'Lancer', 'Eclipse Cross', 'Outlander', 'ASX', 'Pajero', 'L200', 'Galant'],
  },
  {
    name: 'Chevrolet',
    models: ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Blazer', 'Equinox', 'Traverse', 'Tahoe', 'Suburban', 'Silverado', 'Colorado', 'Trailblazer', 'Bolt EV'],
  },
  {
    name: 'Dodge',
    models: ['Challenger', 'Charger', 'Durango', 'Dart', 'Viper'],
  },
  {
    name: 'Suzuki',
    models: ['Alto', 'Swift', 'Baleno', 'Ignis', 'Vitara', 'SX4 S-Cross', 'Jimny', 'Across'],
  },
  {
    name: 'Dacia',
    models: ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker', 'Spring', 'Jogger'],
  },
  {
    name: 'Mini',
    models: ['Mini 3-door', 'Mini 5-door', 'Mini Convertible', 'Mini Clubman', 'Mini Countryman', 'Mini Paceman', 'Mini Coupe', 'Mini Roadster', 'Mini Electric'],
  },
  {
    name: 'Lexus',
    models: ['CT', 'IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'RZ'],
  },
  {
    name: 'Maserati',
    models: ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'GranCabrio', 'MC20', 'Grecale'],
  },
  {
    name: 'Bentley',
    models: ['Continental GT', 'Continental GTC', 'Flying Spur', 'Bentayga', 'Mulsanne'],
  },
  {
    name: 'Rolls-Royce',
    models: ['Ghost', 'Wraith', 'Dawn', 'Phantom', 'Cullinan', 'Spectre'],
  },
  {
    name: 'Aston Martin',
    models: ['Vantage', 'DB11', 'DBS', 'DBX', 'DB12', 'Valkyrie'],
  },
  {
    name: 'McLaren',
    models: ['720S', '765LT', 'GT', 'Artura', '570S', '600LT', 'Senna', 'P1'],
  },
  {
    name: 'Bugatti',
    models: ['Chiron', 'Chiron Sport', 'Chiron Super Sport', 'Veyron', 'Bolide', 'Tourbillon'],
  },
  {
    name: 'Pagani',
    models: ['Huayra', 'Huayra Roadster', 'Huayra BC', 'Zonda'],
  },
  {
    name: 'Koenigsegg',
    models: ['Agera RS', 'Jesko', 'Gemera', 'Regera', 'Regera CC850'],
  },
  {
    name: 'Genesis',
    models: ['G70', 'G80', 'G90', 'GV70', 'GV80', 'GV60'],
  },
  {
    name: 'Cadillac',
    models: ['CT4', 'CT5', 'Escalade', 'XT4', 'XT5', 'XT6', 'Lyriq'],
  },
  {
    name: 'Lincoln',
    models: ['Corsair', 'Nautilus', 'Aviator', 'Navigator'],
  },
  {
    name: 'Infiniti',
    models: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
  },
  {
    name: 'Acura',
    models: ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX', 'Integra'],
  },
  {
    name: 'Chrysler',
    models: ['300', 'Pacifica', 'Voyager'],
  },
  {
    name: 'RAM',
    models: ['1500', '2500', '3500', 'ProMaster'],
  },
  {
    name: 'GMC',
    models: ['Terrain', 'Acadia', 'Yukon', 'Sierra', 'Canyon', 'Envoy'],
  },
  {
    name: 'Buick',
    models: ['Encore', 'Envision', 'Enclave', 'LaCrosse'],
  },
  {
    name: 'Lancia',
    models: ['Ypsilon', 'Delta', 'Stratos', 'Thema'],
  },
  {
    name: 'DS',
    models: ['DS 3', 'DS 4', 'DS 7', 'DS 9'],
  },
  {
    name: 'Smart',
    models: ['fortwo', 'forfour', '#1', '#3'],
  },
  {
    name: 'Alpine',
    models: ['A110', 'A110 S', 'A290'],
  },
  {
    name: 'BYD',
    models: ['Atto 3', 'Seal', 'Dolphin', 'Han', 'Tang', 'Seal U', 'Sea Lion 6'],
  },
  {
    name: 'Polestar',
    models: ['Polestar 2', 'Polestar 3', 'Polestar 4'],
  },
  {
    name: 'Rivian',
    models: ['R1T', 'R1S'],
  },
  {
    name: 'Lucid',
    models: ['Air', 'Gravity'],
  },
  {
    name: 'Other',
    models: ['Other'],
  },
];

export const MAKE_NAMES = VEHICLE_MAKES.map((m) => m.name);

export function getModelsForMake(makeName: string): string[] {
  return VEHICLE_MAKES.find((m) => m.name === makeName)?.models ?? [];
}

// ─── Motorbike makes ──────────────────────────────────────────────────────────

export const MOTORBIKE_MAKES: VehicleMake[] = [
  {
    name: 'Honda',
    models: ['CB500F', 'CB500R', 'CB650R', 'CB1000R', 'CBR500R', 'CBR650R', 'CBR1000RR-R', 'CMX500 Rebel', 'CMX1100 Rebel', 'CRF300L', 'CRF450L', 'Africa Twin 1100', 'X-ADV 750', 'Forza 750', 'Forza 350', 'PCX 125', 'Gold Wing'],
  },
  {
    name: 'Yamaha',
    models: ['MT-03', 'MT-07', 'MT-09', 'MT-09 SP', 'MT-10', 'YZF-R3', 'YZF-R7', 'YZF-R1', 'YZF-R1M', 'Tracer 7', 'Tracer 9', 'Ténéré 700', 'NMAX 125', 'XMAX 300', 'XMAX 400', 'TMAX 560', 'XSR700', 'XSR900'],
  },
  {
    name: 'Kawasaki',
    models: ['Ninja 400', 'Ninja 650', 'Ninja ZX-4R', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja ZX-10RR', 'Ninja H2', 'Z400', 'Z650', 'Z900', 'Z900RS', 'Z H2', 'Versys 650', 'Versys 1000', 'Vulcan S 650', 'W800'],
  },
  {
    name: 'Suzuki',
    models: ['GSX-8S', 'GSX-S750', 'GSX-S1000', 'GSX-S1000GT', 'GSX-R600', 'GSX-R750', 'GSX-R1000R', 'V-Strom 650', 'V-Strom 800DE', 'V-Strom 1050', 'SV650', 'SV650X', 'Hayabusa', 'Burgman 400'],
  },
  {
    name: 'BMW',
    models: ['S 1000 RR', 'S 1000 R', 'S 1000 XR', 'M 1000 RR', 'M 1000 R', 'R 1250 GS', 'R 1250 GS Adventure', 'R 1300 GS', 'F 900 R', 'F 900 XR', 'F 800 GS', 'G 310 R', 'G 310 GS', 'R nineT', 'R nineT Scrambler', 'K 1600 GT', 'K 1600 GTL'],
  },
  {
    name: 'Ducati',
    models: ['Panigale V2', 'Panigale V4', 'Panigale V4 S', 'Streetfighter V2', 'Streetfighter V4', 'Monster', 'Monster SP', 'SuperSport 950', 'Multistrada V2', 'Multistrada V4', 'Multistrada V4 S', 'Diavel V4', 'Scrambler Icon', 'Scrambler 1100', 'DesertX', 'Hypermotard 950'],
  },
  {
    name: 'KTM',
    models: ['Duke 390', 'Duke 490', 'Duke 790', 'Duke 890', 'Duke 890 R', 'Duke 1290 Super Duke', 'Duke 1290 Super Duke R', 'RC 390', '790 Adventure', '890 Adventure', '890 Adventure R', '1190 Adventure', '1290 Super Adventure', '390 SMC R'],
  },
  {
    name: 'Triumph',
    models: ['Trident 660', 'Street Triple R', 'Street Triple RS', 'Speed Triple 1200 RS', 'Tiger Sport 660', 'Tiger 900', 'Tiger 900 GT Pro', 'Tiger 1200', 'Rocket 3 R', 'Rocket 3 GT', 'Bonneville T100', 'Bonneville T120', 'Thruxton RS', 'Speed 400', 'Scrambler 400 X', 'Scrambler 1200'],
  },
  {
    name: 'Aprilia',
    models: ['RS 660', 'Tuono 660', 'RS 457', 'Tuono V4', 'RSV4', 'RSV4 Factory', 'Shiver 900', 'Dorsoduro 900', 'SR GT 125', 'SR GT 200'],
  },
  {
    name: 'Harley-Davidson',
    models: ['Nightster 975', 'Nightster Special', 'Sportster S', 'Iron 883', 'Forty-Eight', 'Street Glide', 'Street Glide Special', 'Road Glide', 'Road Glide Special', 'Fat Boy', 'Fat Bob 114', 'Low Rider ST', 'Softail Standard', 'Pan America 1250', 'Pan America 1250 Special'],
  },
  {
    name: 'Royal Enfield',
    models: ['Meteor 350', 'Classic 350', 'Bullet 350', 'Hunter 350', 'Himalayan', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 650', 'Scram 411', 'Shotgun 650'],
  },
  {
    name: 'Vespa',
    models: ['Primavera 125', 'Primavera 150', 'GTS 300', 'GTS Super 300', 'GTV 300', 'Sprint 125', 'Sprint 150', 'Elettrica'],
  },
  {
    name: 'MV Agusta',
    models: ['Brutale 800', 'Brutale 1000', 'F3 800', 'F4', 'Turismo Veloce 800', 'Superveloce 800', 'Lucky Explorer 9.5'],
  },
  {
    name: 'Benelli',
    models: ['Leoncino 500', 'TRK 502', 'TRK 502 X', 'TRK 800', '502 C', '752 S', '302 R'],
  },
  {
    name: 'CFMoto',
    models: ['300NK', '450NK', '650NK', '650MT', '800MT', '800MT Sport', '1000NK'],
  },
  {
    name: 'Other',
    models: ['Other'],
  },
];

export const MOTORBIKE_MAKE_NAMES = MOTORBIKE_MAKES.map((m) => m.name);

export function getMotorbikeModelsForMake(makeName: string): string[] {
  return MOTORBIKE_MAKES.find((m) => m.name === makeName)?.models ?? [];
}
