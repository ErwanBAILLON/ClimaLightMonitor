import { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "tailwindcss/tailwind.css";

interface Device {
  _id: string;
  createdAt: string;
  deviceId: string;
  registered: boolean;
}

const Devices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId");
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/devices?userId=${userId}`);
        if (!Array.isArray(response.data)) throw new Error("Données invalides !");
        setDevices(response.data);
        setError(null); // Réinitialise les erreurs si tout se passe bien
      } catch (err) {
        console.error("Erreur lors de la récupération des appareils :", err);
        setError("Une erreur est survenue lors de la récupération des appareils.");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  const handleAssociate = async (deviceId: string) => {
    try {
      setProcessing(deviceId); // Indique que cet appareil est en cours de traitement
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Utilisateur non connecté !");
      
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/devices/register`, {
        deviceId,
        userId,
      });
      localStorage.setItem("deviceId", deviceId);
      // Mettre à jour l'état pour refléter le changement
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.deviceId === deviceId ? { ...device, registered: true } : device
        )
      );
    } catch (err) {
      console.error("Erreur lors de l'association de l'appareil :", err);
      setError("Impossible d'associer l'appareil. Veuillez réessayer.");
    } finally {
      setProcessing(null);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      setProcessing(deviceId); // Indique que cet appareil est en cours de traitement
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/devices/deregister`, { deviceId });
      localStorage.removeItem("deviceId");
      // Mettre à jour l'état pour refléter le changement
      setDevices((prevDevices) =>
        prevDevices.map((device) =>
          device.deviceId === deviceId ? { ...device, registered: false } : device
        )
      );
    } catch (err) {
      console.error("Erreur lors de la déconnexion de l'appareil :", err);
      setError("Impossible de déconnecter l'appareil. Veuillez réessayer.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar data={devices} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Liste des appareils" />

        {/* Main content */}
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md text-center mx-auto">
              {error}
            </div>
          ) : devices.length === 0 ? (
            <p className="text-center text-gray-600">Aucun appareil trouvé.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div
                  key={device._id}
                  className="bg-gray-100 shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    ID de l&apos;appareil : {device.deviceId}
                  </h3>
                  <p className="text-gray-600">
                    <strong>Enregistré :</strong>{" "}
                    <span
                      className={`font-semibold ${
                        device.registered ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {device.registered ? "Oui" : "Non"}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <strong>Ajouté le :</strong>{" "}
                    {new Date(device.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4">
                    {!device.registered ? (
                      <button
                        className={`w-full px-4 py-2 rounded-md text-white ${
                          processing === device.deviceId
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        onClick={() => handleAssociate(device.deviceId)}
                        disabled={processing === device.deviceId}
                      >
                        {processing === device.deviceId ? "Association..." : "Associer"}
                      </button>
                    ) : (
                      <button
                        className={`w-full px-4 py-2 rounded-md text-white ${
                          processing === device.deviceId
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                        onClick={() => handleDisconnect(device.deviceId)}
                        disabled={processing === device.deviceId}
                      >
                        {processing === device.deviceId ? "Déconnexion..." : "Dissocier"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Devices;
