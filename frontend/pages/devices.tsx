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
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/devices?userId=${userId}`)
      .then((response) => {
        setDevices(response.data);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des appareils :", err);
        setError("Impossible de récupérer vos appareils enregistrés.");
      });
  }, []);

  const handleViewData = (deviceId: string) => {
    router.push(`/dashboard?deviceId=${deviceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">Mes Appareils</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="w-full max-w-2xl">
        <ul className="bg-white shadow-md rounded-md">
          {devices.map((device) => (
            <li
              key={device.deviceId}
              className="p-4 flex justify-between items-center border-b last:border-none"
            >
              <span>{device.deviceName}</span>
              <button
                onClick={() => handleViewData(device.deviceId)}
                className="text-blue-500 hover:underline"
              >
                Voir les données
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Devices;
