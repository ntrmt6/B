import { Order } from '../../../types';

export const STATUS_COLORS: Record<Order['status'], string> = {
  Pending: 'text-orange-600 bg-orange-50 border border-orange-200',
  Confirmed: 'text-blue-600 bg-blue-50 border border-blue-200',
  'On Hold': 'text-amber-600 bg-amber-50 border border-amber-200',
  Processing: 'text-cyan-600 bg-cyan-50 border border-cyan-200',
  Shipped: 'text-indigo-600 bg-indigo-50 border border-indigo-200',
  'Sent to Courier': 'text-purple-600 bg-purple-50 border border-purple-200',
  Delivered: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
  Cancelled: 'text-red-600 bg-red-50 border border-red-200',
  Return: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
  Refund: 'text-pink-600 bg-pink-50 border border-pink-200',
  'Returned Receive': 'text-slate-600 bg-slate-50 border border-slate-200',
  Incomplete: 'text-gray-600 bg-blue-100 border border-gray-200',
};

export const STATUSES: Order['status'][] = [
  'Pending', 'Confirmed', 'On Hold', 'Processing', 'Shipped',
  'Sent to Courier', 'Delivered', 'Cancelled', 'Return', 'Refund', 'Returned Receive',
];

export const NORMAL_STATUSES: Order['status'][] = [
  'Pending', 'Confirmed', 'On Hold', 'Shipped', 'Sent to Courier', 'Delivered',
];

export const TERMINAL_STATUSES: Order['status'][] = [
  'Cancelled', 'Return', 'Refund', 'Returned Receive',
];

export const STATUS_LABELS: Record<Order['status'], string> = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  'On Hold': 'On Hold',
  Processing: 'Shipping',
  Shipped: 'Shipping',
  'Sent to Courier': 'Sent To Courier',
  Delivered: 'Delivered',
  Cancelled: 'Cancel',
  Return: 'Return',
  Refund: 'Refund',
  'Returned Receive': 'Returned Receive',
  Incomplete: 'Incomplete',
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);

export const getCourierId = (order: Order): string | undefined => {
  if (order.trackingId) return order.trackingId;
  if (order.courierMeta) {
    return (
      (order.courierMeta.tracking_id as string) ||
      (order.courierMeta.trackingCode as string) ||
      (order.courierMeta.consignment_id as string) ||
      (order.courierMeta.invoice as string)
    );
  }
  return undefined;
};

export type Division =
  | 'Dhaka'
  | 'Chattogram'
  | 'Rajshahi'
  | 'Khulna'
  | 'Barishal'
  | 'Sylhet'
  | 'Rangpur'
  | 'Mymensingh';

export const BD_LOCATIONS: Record<Division, Record<string, string[]>> = {
  Dhaka: {
    Dhaka: ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Uttara', 'Tejgaon', 'Badda', 'Banani', 'Farmgate', 'Motijheel'],
    Gazipur: ['Gazipur Sadar', 'Kaliakoir', 'Kapasia', 'Sreepur', 'Kaliganj', 'Tongi'],
    Narayanganj: ['Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'],
    Tangail: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Dhanbari'],
  },
  Chattogram: {
    Chattogram: ['Panchlaish', 'Kotwali', 'Chandgaon', 'Bayezid', 'Hathazari', 'Rangunia', 'Sitakunda', 'Mirsharai'],
    "Cox's Bazar": ["Cox's Bazar Sadar", 'Chakaria', 'Ramu', 'Ukhia', 'Teknaf', 'Maheshkhali', 'Pekua', 'Kutubdia'],
    Comilla: ['Comilla Sadar', 'Barura', 'Brahmanparia', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksham', 'Muradnagar', 'Nangalkot'],
    Feni: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Fulgazi', 'Parshuram', 'Sonagazi'],
  },
  Rajshahi: {
    Rajshahi: ['Rajshahi Sadar', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
    Bogra: ['Bogra Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola'],
    Pabna: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
    Natore: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Naldanga', 'Singra'],
  },
  Khulna: {
    Khulna: ['Khulna Sadar', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsa', 'Terokhada'],
    Jessore: ['Jessore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
    Satkhira: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
    Bagerhat: ['Barishal Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
  },
  Barishal: {
    Barishal: ['Barishal Sadar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
    Patuakhali: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Dumki', 'Rangabali'],
    Bhola: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
    Jhalokati: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  },
  Sylhet: {
    Sylhet: ['Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Balaganj', 'Osmani Nagar'],
    Moulvibazar: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal'],
    Habiganj: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shayestaganj'],
    Sunamganj: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sulla', 'Tahirpur'],
  },
  Rangpur: {
    Rangpur: ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
    Dinajpur: ['Dinajpur Sadar', 'Biral', 'Birampur', 'Birganj', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
    Kurigram: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raomari', 'Ulipur'],
    Nilphamari: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Saidpur'],
  },
  Mymensingh: {
    Mymensingh: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal'],
    Jamalpur: ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
    Netrokona: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala'],
    Sherpur: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
  },
};
