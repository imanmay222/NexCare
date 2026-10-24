import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import {
  FileText,
  Download,
  Calendar,
  Pill,
  Activity,
  Heart,
  TestTube,
  User,
  AlertCircle,
  Shield,
  RefreshCw,
  Eye,
  X,
  LoaderCircle
} from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface User {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'pharmacy';
  email: string;
  language: 'en' | 'hi' | 'pa';
}

interface HealthRecordsProps {
  user: User;
  language: 'en' | 'hi' | 'pa';
  isOnline: boolean;
}

interface MedicalRecord {
  id: string;
  type: 'consultation' | 'prescription' | 'lab-result' | 'vital-signs';
  date: string;
  doctor: string;
  title: string;
  summary: string;
  details: any;
  status: 'final' | 'preliminary' | 'pending';
  prescription?: Prescription;
}

interface PrescriptionMedicine {
  medicineName?: string | null;
  dosage?: string | null;
  dosageUnit?: string | null;
  form?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  durationUnit?: string | null;
  foodInstruction?: string | null;
  instructions?: string | null;
}

interface Prescription {
  id: string;
  a_id: string;
  created_at: string;
  title?: string | null;
  symptoms?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  physical_examination?: string | null;
  drug?: PrescriptionMedicine[] | null;
  investigations?: string | null;
  summary?: string | null;
  follow_up_date?: string | null;
  status?: string | null;
  finalized_at?: string | null;
  name?: string | null;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_gender?: string | null;
  patient_id?: string | null;
}

interface ConsultationResponse {
  data: Prescription[] | null;
  success: boolean;
}

const displayPrescriptionDate = (value?: string | null): string => {
  if (!value) return 'Not specified';
  const datePart = value.slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart)
    ? new Date(`${datePart}T12:00:00`)
    : new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not specified'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
};

const prescriptionValue = (value?: string | null): string =>
  value?.trim() || 'Not specified';

interface VitalSigns {
  id: string;
  date: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  bmi: string;
  spo2?: string;
}

interface MedicalSummary {
  bloodType: string;
  allergies: string[];
  currentMedications: string[];
  medicalConditions: string[];
  emergencyContacts: {
    name: string;
    phone: string;
  }[];
  insurance: string;
}

export function HealthRecords({ user, language, isOnline }: HealthRecordsProps) {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const downloadLock = useRef(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing'>('synced');

  const translations = {
    en: {
      title: "Health Records",
      subtitle: "Your complete medical history and documents",
      consultations: "Consultations",
      prescriptions: "Prescriptions",
      labResults: "Lab Results",
      vitals: "Vital Signs",
      summary: "Medical Summary",
      download: "Download",
      viewPrescription: "View",
      view: "View Details",
      syncData: "Sync Data",
      lastSync: "Last synced",
      offlineMode: "Offline Mode - Records cached locally",
      noRecords: "No records available",
      emergencyAccess: "Emergency Access",
      emergencyInfo: "Critical medical information for emergency situations",
      allergies: "Allergies",
      medications: "Current Medications",
      conditions: "Medical Conditions",
      contacts: "Emergency Contacts",
      bloodType: "Blood Type",
      insurance: "Insurance Info",
      date: "Date",
      doctor: "Doctor",
      diagnosis: "Diagnosis",
      medication: "Medication",
      dosage: "Dosage",
      frequency: "Frequency",
      instructions: "Instructions",
      normal: "Normal",
      abnormal: "Abnormal",
      pending: "Pending"
    },
    hi: {
      title: "स्वास्थ्य रिकॉर्ड",
      subtitle: "आपका पूरा चिकित्सा इतिहास और दस्तावेज",
      consultations: "परामर्श",
      prescriptions: "नुस्खे",
      labResults: "लैब परिणाम",
      vitals: "महत्वपूर्ण संकेत",
      summary: "चिकित्सा सारांश",
      download: "डाउनलोड",
      viewPrescription: "देखें",
      view: "विवरण देखें",
      syncData: "डेटा सिंक करें",
      lastSync: "अंतिम बार सिंक",
      offlineMode: "ऑफलाइन मोड - रिकॉर्ड स्थानीय रूप से संग्रहीत",
      noRecords: "कोई रिकॉर्ड उपलब्ध नहीं",
      emergencyAccess: "आपातकालीन पहुंच",
      emergencyInfo: "आपातकालीन स्थितियों के लिए महत्वपूर्ण चिकित्सा जानकारी",
      allergies: "एलर्जी",
      medications: "वर्तमान दवाएं",
      conditions: "चिकित्सा स्थितियां",
      contacts: "आपातकालीन संपर्क",
      bloodType: "रक्त समूह",
      insurance: "बीमा जानकारी",
      date: "तारीख",
      doctor: "डॉक्टर",
      diagnosis: "निदान",
      medication: "दवा",
      dosage: "खुराक",
      frequency: "आवृत्ति",
      instructions: "निर्देश",
      normal: "सामान्य",
      abnormal: "असामान्य",
      pending: "लंबित"
    },
    pa: {
      title: "ਸਿਹਤ ਰਿਕਾਰਡ",
      subtitle: "ਤੁਹਾਡਾ ਪੂਰਾ ਮੈਡੀਕਲ ਇਤਿਹਾਸ ਅਤੇ ਦਸਤਾਵੇਜ਼",
      consultations: "ਸਲਾਹ",
      prescriptions: "ਨੁਸਖੇ",
      labResults: "ਲੈਬ ਨਤੀਜੇ",
      vitals: "ਮਹੱਤਵਪੂਰਨ ਸੰਕੇਤ",
      summary: "ਮੈਡੀਕਲ ਸਾਰਾਂਸ਼",
      download: "ਡਾਊਨਲੋਡ",
      viewPrescription: "ਵੇਖੋ",
      view: "ਵੇਰਵੇ ਦੇਖੋ",
      syncData: "ਡੇਟਾ ਸਿੰਕ ਕਰੋ",
      lastSync: "ਆਖਰੀ ਵਾਰ ਸਿੰਕ",
      offlineMode: "ਔਫਲਾਈਨ ਮੋਡ - ਰਿਕਾਰਡ ਸਥਾਨਕ ਤੌਰ 'ਤੇ ਸਟੋਰ",
      noRecords: "ਕੋਈ ਰਿਕਾਰਡ ਉਪਲਬਧ ਨਹੀਂ",
      emergencyAccess: "ਐਮਰਜੈਂਸੀ ਪਹੁੰਚ",
      emergencyInfo: "ਐਮਰਜੈਂਸੀ ਸਥਿਤੀਆਂ ਲਈ ਮਹੱਤਵਪੂਰਨ ਮੈਡੀਕਲ ਜਾਣਕਾਰੀ",
      allergies: "ਐਲਰਜੀਆਂ",
      medications: "ਮੌਜੂਦਾ ਦਵਾਈਆਂ",
      conditions: "ਮੈਡੀਕਲ ਸਥਿਤੀਆਂ",
      contacts: "ਐਮਰਜੈਂਸੀ ਸੰਪਰਕ",
      bloodType: "ਖੂਨ ਦੀ ਕਿਸਮ",
      insurance: "ਬੀਮਾ ਜਾਣਕਾਰੀ",
      date: "ਮਿਤੀ",
      doctor: "ਡਾਕਟਰ",
      diagnosis: "ਨਿਦਾਨ",
      medication: "ਦਵਾਈ",
      dosage: "ਖੁਰਾਕ",
      frequency: "ਬਾਰੰਬਾਰਤਾ",
      instructions: "ਹਦਾਇਤਾਂ",
      normal: "ਸਾਧਾਰਨ",
      abnormal: "ਅਸਧਾਰਨ",
      pending: "ਲੰਬਿਤ"
    }
  };

  const t = translations[language];

  // Mock data
  // const medicalRecords: MedicalRecord[] = [
  //   {
  //     id: '1',
  //     type: 'consultation',
  //     date: '2024-12-15',
  //     doctor: 'Dr. Priya Sharma',
  //     title: 'General Check-up',
  //     summary: 'Routine health examination with vital signs assessment',
  //     details: {
  //       symptoms: 'Fever, body ache',
  //       diagnosis: 'Viral fever',
  //       treatment: 'Rest, hydration, paracetamol'
  //     },
  //     status: 'final'
  //   },
  //   {
  //     id: '2',
  //     type: 'prescription',
  //     date: '2024-12-15',
  //     doctor: 'Dr. Priya Sharma',
  //     title: 'Prescription for Viral Fever',
  //     summary: 'Medication prescribed for viral fever treatment',
  //     details: {
  //       medications: [
  //         {
  //           name: 'Paracetamol 500mg',
  //           dosage: '500mg',
  //           frequency: 'Twice daily',
  //             duration: '5 days',
  //           instructions: 'Take after meals'
  //         }
  //       ]
  //     },
  //     status: 'final'
  //   },
  //   {
  //     id: '3',
  //     type: 'lab-result',
  //     date: '2024-12-10',
  //     doctor: 'Dr. Rajesh Kumar',
  //     title: 'Blood Test Results',
  //     summary: 'Complete blood count and basic metabolic panel',
  //     details: {
  //       results: [
  //         { parameter: 'Hemoglobin', value: '13.5 g/dL', normal: '12-16 g/dL', status: 'normal' },
  //         { parameter: 'Blood Sugar', value: '95 mg/dL', normal: '70-100 mg/dL', status: 'normal' }
  //       ]
  //     },
  //     status: 'final'
  //   }
  // ];

  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);


  //fetch the medical records from the api and update the state.
  useEffect(() => {
    let fetchapi1 = async () => {
      try {
        let response = await axios.get(`http://localhost:8090/patient/labResults`, {
          withCredentials: true
        });
        let data = response.data.data;
        // let records: MedicalRecord[] = data.map((record: any) => ({
        //   id: record.id,
        //   type: 'lab-result',
        //   date: record.created_at.split("T")[0],
        //   doctor: record.name,
        //   title: record.test_group,
        //   summary: record.summary,
        //   details: {
        //     results: record.results.map((res: any) => ({
        //       parameter: res.parameter,
        //       value: res.value,
        //       normal: res.normal,
        //       status: res.status}))
        //   },
        //   status: 'final'
        // }));
        const formattedData = data.map((item: any) => {
          // converting object -> array
          const resultsArray = Object.entries(item.results).map(
            ([parameter, values]: any) => ({
              parameter,
              value: `${values.value} ${values.unit}`,
              normal: `${values.min_value}-${values.max_value} ${values.unit}`,
              status:
                values.value >= values.min_value &&
                  values.value <= values.max_value
                  ? "normal"
                  : "abnormal",
            })
          );
          console.log("RESULTS ARRAY :", resultsArray);
          return {
            id: item.id,
            type: "lab-result",
            date: item.created_at.split("T")[0],
            doctor: item.name,
            title: `${item.test_group} Test Results`,
            summary: item.summary,
            details: {
              results: resultsArray,
            },
            status: "final",
          };
        });

        // console.log("FORMATTED DATA :", formattedData);
        setMedicalRecords((prev) => [...prev, ...formattedData]);
      } catch (error) {
        console.error('Error fetching medical records:', error);
      }
    }

    let fetchapi2 = async () => {
      try {
        const response = await axios.get<ConsultationResponse>(
          `http://localhost:8090/patient/consultationdata`,
          { withCredentials: true }
        );
        const data = response.data.data ?? [];
        let records: MedicalRecord[] = data.map((record) => ({
          id: record.id,
          type: 'consultation',
          date: record.created_at?.split("T")[0] ?? '',
          doctor: record.name ?? '',
          title: record.title ?? '',
          summary: record.summary ?? '',
          details: {
            symptoms: record.symptoms,
            diagnosis: record.diagnosis,
            treatment: record.treatment
          },
          status: 'final'
        }));
        setMedicalRecords((prev) => [...prev, ...records]);
        const prescriptions: MedicalRecord[] = data.map((record) => ({
          id: record.id,
          type: 'prescription',
          date: record.created_at?.split("T")[0] ?? '',
          doctor: record.name ?? '',
          title: `Prescription for ${record.title || 'consultation'}`,
          summary: record.summary || `Prescription for ${record.title || 'consultation'}`,
          details: { medications: record.drug ?? [] },
          status: record.status?.toLowerCase() === 'draft' ? 'preliminary' : 'final',
          prescription: record,
        }));
        setMedicalRecords((prev) => [...prev, ...prescriptions]);
      } catch (error) {
        console.error('Error fetching medical records:', error);
      }
    }
    fetchapi1();
    fetchapi2();
  }, [])

  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);

  //fetch from health record api and update state.
  useEffect(() => {
    // Simulate API call
    let fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:8090/patient/healthmetrics`, {
          withCredentials: true
        });
        let data = response.data.data;
        let vitalSignsData: VitalSigns[] = data.map((record: any) => ({
          id: record.id,
          date: record.created_at.split("T")[0],
          bloodPressure: record.bp.sys + "/" + record.bp.dia,
          heartRate: record.heart_rate,
          temperature: record.temp + "°F",
          weight: record.weight + "kg",
          height: record.height + "cm",
          bmi: (record.weight*10000 / (record.height * record.height)).toFixed(4),
          spo2: record.spo2
        }));
        setVitalSigns(vitalSignsData);
      } catch (error) {
        console.error('Error fetching health records:', error);
      }
    }
    fetchData();
  }, []);


  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary>();
  //fetch the details for Medcial Summary.
  useEffect(() => {
    let fetchMedicalSummary = async () => {
      let response = await axios.get(`http://localhost:8090/patient/healthsummary`, {
        withCredentials: true
      });
      let data = response.data.data[0];
      // console.log(data);
      let summary: MedicalSummary = {
        bloodType: data.blood_type,
        allergies: data.allergies.split(","),
        currentMedications: data.current_medications.split(","),
        medicalConditions: data.medical_conditions.split(","),
        emergencyContacts: data.contacts.map((c: any) => ({ name: c.relation + ":" + c.name, phone: c.phn_no })),
        insurance: data.insurance
      };
      setMedicalSummary(summary);
    };
    fetchMedicalSummary();
  }, []);

  const handleSync = async () => {
    setSyncStatus('syncing');
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncStatus('synced');
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'consultation': return User;
      case 'prescription': return Pill;
      case 'lab-result': return TestTube;
      case 'vital-signs': return Activity;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return 'bg-green-100 text-green-800';
      case 'preliminary': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPrescription = async (
    prescription: Prescription | null = selectedPrescription
  ) => {
    if (!prescription || downloadLock.current) return;
    downloadLock.current = true;
    setIsDownloadingPDF(true);
    setPdfError('');

    try {
      const response = await axios.get<Blob>(
        `http://localhost:8090/patient/prescription/${encodeURIComponent(prescription.a_id)}/pdf`,
        { withCredentials: true, responseType: 'blob' }
      );
      const objectURL = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = objectURL;
      link.download = `NexCare-Prescription-${prescription.a_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    } catch (error) {
      let message = 'Unable to download the prescription PDF.';
      if (axios.isAxiosError<Blob>(error)) {
        const responseData: unknown = error.response?.data;
        if (responseData instanceof Blob) {
          const responseText = await responseData.text();
          try {
            const errorResponse = JSON.parse(responseText) as { Message?: string };
            message = errorResponse.Message || message;
          } catch {
            message = error.message || message;
          }
        } else {
          message = error.message || message;
        }
      }
      setPdfError(message);
    } finally {
      downloadLock.current = false;
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              {!isOnline && (
                <Badge variant="outline" className="text-orange-600">
                  Offline
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || syncStatus === 'syncing'}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {t.syncData}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
      </Card>

      {!isOnline && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t.offlineMode}. Records will sync when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">{t.summary}</TabsTrigger>
          <TabsTrigger value="consultations">{t.consultations}</TabsTrigger>
          <TabsTrigger value="prescriptions">{t.prescriptions}</TabsTrigger>
          <TabsTrigger value="lab-results">{t.labResults}</TabsTrigger>
          <TabsTrigger value="vitals">{t.vitals}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          {/* Emergency Access Card */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <Shield className="h-5 w-5" />
                <span>{t.emergencyAccess}</span>
              </CardTitle>
              <CardDescription>
                {t.emergencyInfo}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t.bloodType}</h4>
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      {medicalSummary?.bloodType ?? 'N/A'}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t.allergies}</h4>
                    <div className="space-y-1">
                      {(medicalSummary?.allergies ?? []).map((allergy, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t.medications}</h4>
                    <div className="space-y-1">
                      {(medicalSummary?.currentMedications ?? []).map((med, index) => (
                        <p key={index} className="text-sm">{med}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t.conditions}</h4>
                    <div className="space-y-1">
                      {(medicalSummary?.medicalConditions ?? []).map((condition, index) => (
                        <p key={index} className="text-sm">{condition}</p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t.contacts}</h4>
                    <div className="space-y-1">
                      {(medicalSummary?.emergencyContacts ?? []).map((contact, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-gray-600">{contact.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t.insurance}</h4>
                    <p className="text-sm">{medicalSummary?.insurance ?? 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Records Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Medical Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medicalRecords.slice(0, 3).map((record) => {
                  const Icon = getRecordIcon(record.type);
                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{record.title}</h4>
                          <p className="text-sm text-gray-600">{record.date} - {record.doctor}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultations">
          <Card>
            <CardHeader>
              <CardTitle>{t.consultations}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalRecords.filter(r => r.type === 'consultation').map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{record.title}</h4>
                        <p className="text-sm text-gray-600">{record.date} - {record.doctor}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          {t.view}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          {t.download}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{record.summary}</p>
                    {record.details && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <p><strong>Symptoms:</strong> {record.details.symptoms}</p>
                        <p><strong>Diagnosis:</strong> {record.details.diagnosis}</p>
                        <p><strong>Treatment:</strong> {record.details.treatment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>{t.prescriptions}</CardTitle>
            </CardHeader>
            <CardContent>
              {pdfError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pdfError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                {medicalRecords.filter(r => r.type === 'prescription').map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{record.title}</h4>
                        <p className="text-sm text-gray-600">{record.date} - {record.doctor}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!record.prescription || isDownloadingPDF}
                          onClick={() => handleDownloadPrescription(record.prescription ?? null)}
                        >
                          {isDownloadingPDF ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          {isDownloadingPDF ? 'Downloading...' : t.download}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!record.prescription}
                          onClick={() => {
                            setPdfError('');
                            setSelectedPrescription(record.prescription ?? null);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t.viewPrescription}
                        </Button>
                      </div>
                    </div>
                    {record.prescription?.drug?.length ? (
                      <div className="space-y-2">
                        {record.prescription.drug.map((med, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                            <h5 className="font-medium">{prescriptionValue(med.medicineName)}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                              <div><strong>{t.dosage}:</strong> {prescriptionValue(med.dosage)} {med.dosageUnit ?? ''}</div>
                              <div><strong>{t.frequency}:</strong> {prescriptionValue(med.frequency)}</div>
                              <div><strong>Duration:</strong> {prescriptionValue(med.duration)} {med.durationUnit ?? ''}</div>
                              <div><strong>{t.instructions}:</strong> {prescriptionValue(med.instructions)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No medicines recorded.</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-results">
          <Card>
            <CardHeader>
              <CardTitle>{t.labResults}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalRecords.filter(r => r.type === 'lab-result').map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{record.title}</h4>
                        <p className="text-sm text-gray-600">{record.date} - {record.doctor}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {t.download}
                      </Button>
                    </div>
                    {record.details?.results && (
                      <div className="space-y-2">
                        {record.details.results.map((result: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium">{result.parameter}</span>
                              <span className="text-sm text-gray-600 ml-2">({result.normal})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{result.value}</span>
                              <Badge
                                className={result.status === 'normal'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }
                              >
                                {result.status === 'normal' ? t.normal : t.abnormal}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle>{t.vitals}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vitalSigns.map((vital) => (
                  <div key={vital.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{vital.date}</h4>
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        View Trends
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <Heart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Blood Pressure</div>
                        <div className="font-semibold">{vital.bloodPressure}</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <Activity className="h-6 w-6 text-red-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Heart Rate</div>
                        <div className="font-semibold">{vital.heartRate} bpm</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Temperature</div>
                        <div className="font-semibold">{vital.temperature}</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <User className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Weight</div>
                        <div className="font-semibold">{vital.weight}</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <User className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">Height</div>
                        <div className="font-semibold">{vital.height}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <Activity className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                        <div className="text-sm text-gray-600">BMI</div>
                        <div className="font-semibold">{vital.bmi}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedPrescription !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPrescription(null);
            setPdfError('');
          }
        }}
      >
        <DialogContent
          className="!top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !rounded-2xl !border-slate-200 !bg-slate-100 !shadow-2xl"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            width: 'calc(100vw - 2rem)',
            maxWidth: '1000px',
            height: 'min(90vh, 900px)',
            maxHeight: 'calc(100vh - 2rem)',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {selectedPrescription && (
            <>
              <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 pr-14 text-left sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-700 p-2.5 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg font-bold text-slate-900 sm:text-xl">
                      Digital prescription
                    </DialogTitle>
                    <DialogDescription className="mt-1 truncate">
                      Appointment <span className="font-medium text-slate-700">{selectedPrescription.a_id}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div
                className="w-full touch-pan-y overscroll-contain p-3 sm:p-6"
                style={{
                  flex: '1 1 0%',
                  height: 0,
                  minHeight: 0,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehaviorY: 'contain',
                }}
              >
                <div className="mx-auto w-full max-w-4xl space-y-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-2xl font-extrabold tracking-tight text-blue-800">NexCare</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Digital prescription
                        </p>
                      </div>
                      <Badge className={
                        selectedPrescription.status?.toLowerCase() === 'draft'
                          ? 'border-amber-200 bg-amber-50 px-3 py-1 text-amber-800'
                          : 'border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800'
                      }>
                        {prescriptionValue(selectedPrescription.status)}
                      </Badge>
                    </div>

                    <div className="grid gap-x-8 gap-y-5 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                      <PrescriptionViewField label="Patient" value={selectedPrescription.patient_name || user.name} />
                      <PrescriptionViewField label="Patient ID" value={selectedPrescription.patient_id} />
                      <PrescriptionViewField label="Age" value={
                        selectedPrescription.patient_age == null
                          ? null
                          : `${selectedPrescription.patient_age} years`
                      } />
                      <PrescriptionViewField label="Gender" value={selectedPrescription.patient_gender} />
                      <PrescriptionViewField label="Prescribing doctor" value={selectedPrescription.name} />
                      <PrescriptionViewField label="Prescription date" value={displayPrescriptionDate(selectedPrescription.created_at)} />
                    </div>
                  </section>

                  <div className="grid items-start gap-4 lg:grid-cols-2">
                    <PrescriptionViewSection title="Prescription Details">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <PrescriptionViewField label="Prescription ID" value={selectedPrescription.id} />
                        <PrescriptionViewField label="Appointment ID" value={selectedPrescription.a_id} />
                        <PrescriptionViewField label="Title" value={selectedPrescription.title} />
                        <PrescriptionViewField label="Diagnosis" value={selectedPrescription.diagnosis} />
                        <div className="sm:col-span-2">
                          <PrescriptionViewField label="Symptoms" value={selectedPrescription.symptoms} />
                        </div>
                      </div>
                    </PrescriptionViewSection>

                    <PrescriptionViewSection title="Clinical Information">
                      <div className="space-y-4">
                        <PrescriptionViewField label="Physical Examination" value={selectedPrescription.physical_examination} />
                        <PrescriptionViewField label="Treatment / General Instructions" value={selectedPrescription.treatment} />
                        <PrescriptionViewField label="Investigations" value={selectedPrescription.investigations} />
                      </div>
                    </PrescriptionViewSection>
                  </div>

                  <PrescriptionViewSection title="Medicines">
                    {selectedPrescription.drug?.length ? (
                      <div className="space-y-3">
                        {selectedPrescription.drug.map((medicine, index) => (
                          <article key={`${medicine.medicineName ?? 'medicine'}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                            <h4 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                                <Pill className="h-4 w-4" />
                              </span>
                              {prescriptionValue(medicine.medicineName)}
                            </h4>
                            <div className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                              <PrescriptionViewField label="Form" value={medicine.form} />
                              <PrescriptionViewField label="Dosage" value={[medicine.dosage, medicine.dosageUnit].filter(Boolean).join(' ')} />
                              <PrescriptionViewField label="Route" value={medicine.route} />
                              <PrescriptionViewField label="Frequency" value={medicine.frequency} />
                              <PrescriptionViewField label="Duration" value={[medicine.duration, medicine.durationUnit].filter(Boolean).join(' ')} />
                              <PrescriptionViewField label="Food Instructions" value={medicine.foodInstruction} />
                              <div className="sm:col-span-2">
                                <PrescriptionViewField label="Instructions" value={medicine.instructions} />
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No medicines recorded.</p>
                    )}
                  </PrescriptionViewSection>

                  <div className="grid items-start gap-4 sm:grid-cols-2">
                    <PrescriptionViewSection title="Follow Up">
                      <PrescriptionViewField
                        label="Follow-up Date"
                        value={displayPrescriptionDate(selectedPrescription.follow_up_date)}
                      />
                    </PrescriptionViewSection>

                    <PrescriptionViewSection title="Prescription Status">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <PrescriptionViewField label="Status" value={selectedPrescription.status} />
                        {selectedPrescription.finalized_at && (
                          <PrescriptionViewField
                            label="Finalized At"
                            value={displayPrescriptionDate(selectedPrescription.finalized_at)}
                          />
                        )}
                      </div>
                    </PrescriptionViewSection>
                  </div>

                  <PrescriptionViewSection title="Summary">
                    <PrescriptionViewField label="Summary" value={selectedPrescription.summary} />
                  </PrescriptionViewSection>

                </div>
              </div>

              <DialogFooter className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-8">
                <Button
                  onClick={handleDownloadPrescription}
                  disabled={isDownloadingPDF || !selectedPrescription.a_id}
                  className="bg-blue-700 text-white hover:bg-blue-800"
                >
                  {isDownloadingPDF ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" aria-label="Close prescription">
                    <X className="h-4 w-4" />
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrescriptionViewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
        <span className="h-4 w-1 rounded-full bg-blue-700" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function PrescriptionViewField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const displayValue =
    value == null || String(value).trim() === ''
      ? 'Not specified'
      : String(value);

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">{displayValue}</p>
    </div>
  );
}