import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

interface Device {
  deviceId: string;
  deviceName: string;
}

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("Utilisateur non connecté !");
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/devices?userId=${userId}`);
        console.log("Données reçues :", response.data);
        setDevices(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des appareils :", error);
        setDevices([]); // Définit un tableau vide si une erreur survient
      }
    };
  
    fetchDevices();
  }, []);

  // const handleViewData = (deviceId: string) => {
  //   router.push(`/dashboard?deviceId=${deviceId}`);
  // };

  return (
    <div>
      {devices.length > 0 ? (
        devices.map((device) => (
          <div key={device.deviceId}>
            <p>{device.deviceName}</p>
          </div>
        ))
      ) : (
        <p>Aucun appareil trouvé.</p>
      )}
    </div>
  );
}

export default Devices;
