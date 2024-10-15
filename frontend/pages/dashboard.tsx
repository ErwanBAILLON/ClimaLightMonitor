import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SensorChart from '../components/SensorChart';
import DonutChart from '../components/DonutChart';
import Card from '../components/Card';
import "tailwindcss/tailwind.css";

type DataKeys = 'temperature' | 'humidity' | 'luminosity';

export default function Dashboard() {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    luminosity: 0,
    chartData: [],
    averages: { temperature: 0, humidity: 0, luminosity: 0, maxTemperature: 0 },
    selectedGraph: 'temperature' as DataKeys,
    showAverages: false,
    showDonut: false,
  });

  const [showToast, setShowToast] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchData = () => {
    axios.get('http://localhost:8080/data')
      .then((response) => {
        const latestData = response.data[response.data.length - 1];
        const chartData = response.data.map((data: { temperature: number; humidity: number; luminosity: number; timestamp: string; }) => ({
          temperature: data.temperature,
          humidity: data.humidity,
          luminosity: data.luminosity,
          timestamp: data.timestamp,
        }));

        const averages = calculateAverages(response.data);

        setData((prevData) => ({
          ...prevData,
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          luminosity: latestData.luminosity,
          chartData,
          averages,
        }));
      })
      .catch((error) => console.error('Erreur lors de la récupération des données:', error));
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchData();
        setShowToast(false);
      } else {
        setShowToast(true);
      }
    }, 120000);

    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateAverages = (data: { temperature: number; humidity: number; luminosity: number; }[]) => {
    const total = data.length;
    const sum = data.reduce(
      (acc, curr) => ({
        temperature: acc.temperature + curr.temperature,
        humidity: acc.humidity + curr.humidity,
        luminosity: acc.luminosity + curr.luminosity,
      }),
      { temperature: 0, humidity: 0, luminosity: 0 }
    );
    const maxTemperature = Math.max(...data.map(d => d.temperature));
    return {
      temperature: sum.temperature / total,
      humidity: sum.humidity / total,
      luminosity: sum.luminosity / total,
      maxTemperature
    };
  };

  const toggleGraph = (type: DataKeys) => {
    setData((prevData) => ({
      ...prevData,
      selectedGraph: type,
    }));
  };

  const toggleDonut = () => {
    setData((prevData) => ({
      ...prevData,
      showDonut: !prevData.showDonut,
    }));
  };

  const toggleAverages = () => {
    setData((prevData) => ({
      ...prevData,
      showAverages: !prevData.showAverages,
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-100 overflow-y-auto">
        <Header title="Dashboard" />

        {/* Toast pour afficher le statut hors ligne */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-md shadow-lg">
            Vous êtes hors ligne
          </div>
        )}

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Température Actuelle" value={`${data.temperature}°C`} />
          <Card title="Humidité Actuelle" value={`${data.humidity}%`} />
          <Card title="Luminosité Actuelle" value={`${data.luminosity} lux`} />
        </div>

        <div className="flex justify-center space-x-4 p-4 flex-wrap">
          <button
            className={`py-2 px-4 rounded ${data.selectedGraph === 'temperature' ? 'bg-blue-500' : 'bg-gray-400'} text-white`}
            onClick={() => toggleGraph('temperature')}
          >
            Température
          </button>
          <button
            className={`py-2 px-4 rounded ${data.selectedGraph === 'humidity' ? 'bg-green-500' : 'bg-gray-400'} text-white`}
            onClick={() => toggleGraph('humidity')}
            >
              Humidité
            </button>
            <button
              className={`py-2 px-4 rounded ${data.selectedGraph === 'luminosity' ? 'bg-yellow-500' : 'bg-gray-400'} text-white`}
              onClick={() => toggleGraph('luminosity')}
            >
              Luminosité
            </button>
            <button
              className={`py-2 px-4 rounded ${data.showDonut ? 'bg-purple-500' : 'bg-gray-400'} text-white`}
              onClick={toggleDonut}
            >
              Moyennes (Graphique Donut)
            </button>
            <button
              className={`py-2 px-4 rounded ${data.showAverages ? 'bg-purple-500' : 'bg-gray-400'} text-white`}
              onClick={toggleAverages}
            >
              Afficher Moyennes
            </button>
  
            {/* Bouton de reload */}
            <button
              className={`py-2 px-4 rounded ${isOnline ? 'bg-green-500' : 'bg-gray-400 cursor-not-allowed'} text-white`}
              onClick={isOnline ? fetchData : undefined} // Désactiver si hors ligne
              disabled={!isOnline} // Griser le bouton si hors ligne
            >
              Recharger le Graphique
            </button>
          </div>
  
          <div className="p-4">
            {data.showDonut ? (
              <DonutChart averages={data.averages} selectedGraph={data.selectedGraph} />
            ) : (
              <SensorChart
                chartData={data.chartData}
                selectedGraph={data.selectedGraph}
                averages={data.averages}
                showAverages={data.showAverages}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
  