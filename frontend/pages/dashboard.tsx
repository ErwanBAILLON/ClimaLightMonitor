import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SensorChart from '../components/SensorChart';
import DonutChart from '../components/DonutChart';
import Card from '../components/Card';
import "tailwindcss/tailwind.css";
import withAuth from '@/components/withAuth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

type DataKeys = 'temperature' | 'humidity' | 'luminosity';

function Dashboard() {
  const [data, setData] = useState({
    temperature: 0,
    humidity: 0,
    luminosity: 0,
    chartData: [] as Array<{
      temperature: number;
      humidity: number;
      luminosity: number;
      timestamp: string;
    }>,
    averages: { temperature: 0, humidity: 0, luminosity: 0, maxTemperature: 0 },
    selectedGraph: 'temperature' as DataKeys,
    showAverages: false,
    showDonut: false,
  });

  const [showToast, setShowToast] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchData = () => {
    axios.get('http://localhost:8080/data')
      .then((response) => {
        const responseData = response.data;
        const latestData = responseData[responseData.length - 1];
        const chartData = responseData.map((data: { temperature: number; humidity: number; luminosity: number; timestamp: string; }) => ({
          temperature: data.temperature,
          humidity: data.humidity,
          luminosity: data.luminosity,
          timestamp: data.timestamp,
        }));

        const averages = calculateAverages(chartData);

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
  });

  const calculateAverages = (dataArray: Array<{ temperature: number; humidity: number; luminosity: number; }>) => {
    const total = dataArray.length;
    const sum = dataArray.reduce(
      (acc, curr) => ({
        temperature: acc.temperature + curr.temperature,
        humidity: acc.humidity + curr.humidity,
        luminosity: acc.luminosity + curr.luminosity,
      }),
      { temperature: 0, humidity: 0, luminosity: 0 }
    );
    const maxTemperature = Math.max(...dataArray.map(d => d.temperature));
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

  // Filtrer les données en fonction des dates sélectionnées
  const filteredChartData = data.chartData.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    const isAfterStartDate = startDate ? entryDate >= startDate : true;
    const isBeforeEndDate = endDate ? entryDate <= endDate : true;
    return isAfterStartDate && isBeforeEndDate;
  });

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

        {/* Affichage des dernières données sur la même ligne */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card title="Température Actuelle" value={`${data.temperature.toFixed(2)}°C`} />
          <Card title="Humidité Actuelle" value={`${data.humidity.toFixed(2)}%`} />
          <Card title="Luminosité Actuelle" value={`${data.luminosity.toFixed(2)} lux`} />
          <Card
            title="Dernière Mise à Jour"
            value={
              data.chartData.length > 0
                ? format(new Date(data.chartData[data.chartData.length - 1].timestamp), 'dd/MM/yyyy HH:mm:ss')
                : 'N/A'
            }
          />
        </div>

        {/* Sélecteurs de dates pour filtrer les données */}
        <div className="flex justify-center space-x-4 p-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <label className="text-gray-700">Date de début:</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date as Date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className="px-3 py-2 border rounded-md"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-gray-700">Date de fin:</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date as Date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className="px-3 py-2 border rounded-md"
              dateFormat="dd/MM/yyyy"
            />
          </div>
          <button
            className="py-2 px-4 bg-blue-500 text-white rounded-md"
            onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }}
          >
            Réinitialiser les dates
          </button>
        </div>

        {/* Boutons de sélection et de contrôle */}
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

        {/* Graphique avec données filtrées */}
        <div className="p-4">
          {data.showDonut ? (
            <DonutChart averages={data.averages} selectedGraph={data.selectedGraph} />
          ) : (
            <SensorChart
              chartData={filteredChartData}
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

export default withAuth(Dashboard);
