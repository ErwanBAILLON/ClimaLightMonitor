import { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import SensorChart from '../components/SensorChart';
import DonutChart from '../components/DonutChart';
import 'tailwindcss/tailwind.css';
import withAuth from '@/components/withAuth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  subDays,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import { FiRefreshCw } from 'react-icons/fi';
import {
  FaTemperatureHigh,
  FaTint,
  FaLightbulb,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
} from 'react-icons/fa';

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
    averages: {
      temperature: 0,
      humidity: 0,
      luminosity: 0,
      maxTemperature: 0,
      minTemperature: 0,
      maxHumidity: 0,
      minHumidity: 0,
      maxLuminosity: 0,
      minLuminosity: 0,
      heatIndex: 0,
      dewPoint: 0,
    },
    trends: {
      temperature: 'stable',
      humidity: 'stable',
      luminosity: 'stable',
    },
    selectedGraph: 'temperature' as DataKeys,
    showAverages: false,
    showDonut: false,
  });

  const [showToast, setShowToast] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    subDays(new Date(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const fetchData = () => {
    axios
      .get('http://process.env.NEXT_PUBLIC_API_URL/data')
      .then((response) => {
        const responseData = response.data;
        const latestData = responseData[responseData.length - 1];
        const chartData = responseData.map(
          (data: {
            temperature: number;
            humidity: number;
            luminosity: number;
            timestamp: string;
          }) => ({
            temperature: data.temperature,
            humidity: data.humidity,
            luminosity: data.luminosity,
            timestamp: data.timestamp,
          })
        );
        // eslint-disable-next-line
        const filteredData = chartData.filter((entry: any) => {
          const entryDate = parseISO(entry.timestamp);
          const isAfterStartDate = startDate
            ? isAfter(entryDate, startDate) || isEqual(entryDate, startDate)
            : true;
          const isBeforeEndDate = endDate
            ? isBefore(entryDate, endDate) || isEqual(entryDate, endDate)
            : true;
          return isAfterStartDate && isBeforeEndDate;
        });

        const averages = calculateAverages(filteredData);
        const trends = calculateTrends(chartData);

        setData((prevData) => ({
          ...prevData,
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          luminosity: latestData.luminosity,
          chartData,
          averages,
          trends,
        }));
      })
      .catch((error) =>
        console.error('Erreur lors de la récupération des données:', error)
      );
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
    }, 10000);

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
  }, [startDate, endDate]);

  const calculateAverages = (
    dataArray: Array<{
      temperature: number;
      humidity: number;
      luminosity: number;
    }>
  ) => {
    const total = dataArray.length;
    if (total === 0) {
      return {
        temperature: 0,
        humidity: 0,
        luminosity: 0,
        maxTemperature: 0,
        minTemperature: 0,
        maxHumidity: 0,
        minHumidity: 0,
        maxLuminosity: 0,
        minLuminosity: 0,
        heatIndex: 0,
        dewPoint: 0,
      };
    }
    const sum = dataArray.reduce(
      (acc, curr) => ({
        temperature: acc.temperature + curr.temperature,
        humidity: acc.humidity + curr.humidity,
        luminosity: acc.luminosity + curr.luminosity,
      }),
      { temperature: 0, humidity: 0, luminosity: 0 }
    );

    const avgTemperature = sum.temperature / total;
    const avgHumidity = sum.humidity / total;
    const avgLuminosity = sum.luminosity / total;

    const temperatures = dataArray.map((d) => d.temperature);
    const humidities = dataArray.map((d) => d.humidity);
    const luminosities = dataArray.map((d) => d.luminosity);

    const maxTemperature = Math.max(...temperatures);
    const minTemperature = Math.min(...temperatures);
    const maxHumidity = Math.max(...humidities);
    const minHumidity = Math.min(...humidities);
    const maxLuminosity = Math.max(...luminosities);
    const minLuminosity = Math.min(...luminosities);

    // Calcul de l'Indice de Confort Thermique
    const heatIndex =
      avgTemperature -
      (0.55 - 0.0055 * avgHumidity) * (avgTemperature - 14.5);

    // Calcul du Point de Rosée
    const gamma =
      Math.log(avgHumidity / 100) +
      (17.62 * avgTemperature) / (243.12 + avgTemperature);
    const dewPoint = (243.12 * gamma) / (17.62 - gamma);

    return {
      temperature: avgTemperature,
      humidity: avgHumidity,
      luminosity: avgLuminosity,
      maxTemperature,
      minTemperature,
      maxHumidity,
      minHumidity,
      maxLuminosity,
      minLuminosity,
      heatIndex,
      dewPoint,
    };
  };

  const calculateTrends = (
    dataArray: Array<{
      temperature: number;
      humidity: number;
      luminosity: number;
    }>
  ) => {
    if (dataArray.length < 2) {
      return {
        temperature: 'stable',
        humidity: 'stable',
        luminosity: 'stable',
      };
    }

    const latest = dataArray[dataArray.length - 1];
    const previous = dataArray[dataArray.length - 2];

    const getTrend = (current: number, previous: number) => {
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'stable';
    };

    return {
      temperature: getTrend(latest.temperature, previous.temperature),
      humidity: getTrend(latest.humidity, previous.humidity),
      luminosity: getTrend(latest.luminosity, previous.luminosity),
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
    const entryDate = parseISO(entry.timestamp);
    const isAfterStartDate = startDate
      ? isAfter(entryDate, startDate) || isEqual(entryDate, startDate)
      : true;
    const isBeforeEndDate = endDate
      ? isBefore(entryDate, endDate) || isEqual(entryDate, endDate)
      : true;
    return isAfterStartDate && isBeforeEndDate;
  });

  // Seuils pour les alertes (vous pouvez ajuster ces valeurs)
  const thresholds = {
    temperature: { min: 0, max: 30 },
    humidity: { min: 20, max: 80 },
    luminosity: { min: 100, max: 1000 },
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header title="Dashboard" />

        {/* Toast pour afficher le statut hors ligne */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-red-100 text-white p-4 rounded-md shadow-lg flex items-center space-x-2">
            <span className="animate-pulse">🔴</span>
            <span>Vous êtes hors ligne</span>
          </div>
        )}

        {/* Contenu principal */}
        <main className="p-6 space-y-6">
          {/* Section Conditions Actuelles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Conditions Actuelles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Carte Température */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <FaTemperatureHigh className="text-blue-500 text-3xl" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Température
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {data.temperature.toFixed(2)}°C
                    </p>
                  </div>
                  {/* Indicateur de tendance */}
                  <div>
                    {data.trends.temperature === 'up' && (
                      <FaArrowUp className="text-red-500 text-2xl" />
                    )}
                    {data.trends.temperature === 'down' && (
                      <FaArrowDown className="text-green-500 text-2xl" />
                    )}
                    {data.trends.temperature === 'stable' && (
                      <FaEquals className="text-gray-500 text-2xl" />
                    )}
                  </div>
                </div>
                {/* Alerte si hors seuil */}
                {(data.temperature < thresholds.temperature.min ||
                  data.temperature > thresholds.temperature.max) && (
                  <div className="mt-4 text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    Température hors des valeurs normales !
                  </div>
                )}
              </div>

              {/* Carte Humidité */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-4 bg-green-100 rounded-full">
                    <FaTint className="text-green-500 text-3xl" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Humidité
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {data.humidity.toFixed(2)}%
                    </p>
                  </div>
                  {/* Indicateur de tendance */}
                  <div>
                    {data.trends.humidity === 'up' && (
                      <FaArrowUp className="text-red-500 text-2xl" />
                    )}
                    {data.trends.humidity === 'down' && (
                      <FaArrowDown className="text-green-500 text-2xl" />
                    )}
                    {data.trends.humidity === 'stable' && (
                      <FaEquals className="text-gray-500 text-2xl" />
                    )}
                  </div>
                </div>
                {/* Alerte si hors seuil */}
                {(data.humidity < thresholds.humidity.min ||
                  data.humidity > thresholds.humidity.max) && (
                  <div className="mt-4 text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    Humidité hors des valeurs normales !
                  </div>
                )}
              </div>

              {/* Carte Luminosité */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-4 bg-yellow-100 rounded-full">
                    <FaLightbulb className="text-yellow-500 text-3xl" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-700">
                      Luminosité
                    </h3>
                    <p className="text-2xl font-bold text-gray-800">
                      {data.luminosity.toFixed(2)} lux
                    </p>
                  </div>
                  {/* Indicateur de tendance */}
                  <div>
                    {data.trends.luminosity === 'up' && (
                      <FaArrowUp className="text-red-500 text-2xl" />
                    )}
                    {data.trends.luminosity === 'down' && (
                      <FaArrowDown className="text-green-500 text-2xl" />
                    )}
                    {data.trends.luminosity === 'stable' && (
                      <FaEquals className="text-gray-500 text-2xl" />
                    )}
                  </div>
                </div>
                {/* Alerte si hors seuil */}
                {(data.luminosity < thresholds.luminosity.min ||
                  data.luminosity > thresholds.luminosity.max) && (
                  <div className="mt-4 text-red-600 flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    Luminosité hors des valeurs normales !
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section Statistiques sur les dernières 24 heures */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Statistiques sur les dernières 24 heures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Carte Moyenne Température */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Température Moyenne
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {data.averages.temperature.toFixed(2)}°C
                </p>
                <div className="mt-2 text-gray-600">
                  Min : {data.averages.minTemperature.toFixed(2)}°C | Max :{' '}
                  {data.averages.maxTemperature.toFixed(2)}°C
                </div>
              </div>

              {/* Carte Moyenne Humidité */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Humidité Moyenne
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {data.averages.humidity.toFixed(2)}%
                </p>
                <div className="mt-2 text-gray-600">
                  Min : {data.averages.minHumidity.toFixed(2)}% | Max :{' '}
                  {data.averages.maxHumidity.toFixed(2)}%
                </div>
              </div>

              {/* Carte Moyenne Luminosité */}
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Luminosité Moyenne
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {data.averages.luminosity.toFixed(2)} lux
                </p>
                <div className="mt-2 text-gray-600">
                  Min : {data.averages.minLuminosity.toFixed(2)} lux | Max :{' '}
                  {data.averages.maxLuminosity.toFixed(2)} lux
                </div>
              </div>

              {/* Autres cartes si nécessaire */}
            </div>
          </section>

          {/* Section Graphiques */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Visualisation des Données
            </h2>
            {/* Sélecteurs de dates pour filtrer les données */}
            <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 mb-6">
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 font-medium">
                  Date de début :
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date as Date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Sélectionner"
                  maxDate={new Date()}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-gray-700 font-medium">
                  Date de fin :
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date as Date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Sélectionner"
                  maxDate={new Date()}
                />
              </div>
              <button
                className="mt-2 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  setStartDate(subDays(new Date(), 1));
                  setEndDate(new Date());
                }}
              >
                Dernières 24 heures
              </button>
              <button
                className="mt-2 md:mt-0 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Réinitialiser les dates
              </button>
            </div>

            {/* Boutons de sélection et de contrôle */}
            <div className="bg-white shadow-lg rounded-lg p-6 flex flex-wrap items-center justify-center space-x-4 mb-6">
              <button
                className={`py-2 px-4 rounded-full font-medium shadow ${
                  data.selectedGraph === 'temperature'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                }`}
                onClick={() => toggleGraph('temperature')}
              >
                Température
              </button>
              <button
                className={`py-2 px-4 rounded-full font-medium shadow ${
                  data.selectedGraph === 'humidity'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                }`}
                onClick={() => toggleGraph('humidity')}
              >
                Humidité
              </button>
              <button
                className={`py-2 px-4 rounded-full font-medium shadow ${
                  data.selectedGraph === 'luminosity'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                }`}
                onClick={() => toggleGraph('luminosity')}
              >
                Luminosité
              </button>
              <button
                className={`py-2 px-4 rounded-full font-medium shadow ${
                  data.showDonut
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                }`}
                onClick={toggleDonut}
              >
                {data.showDonut ? 'Graphique Linéaire' : 'Graphique Donut'}
              </button>
              <button
                className={`py-2 px-4 rounded-full font-medium shadow ${
                  data.showAverages
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'
                }`}
                onClick={toggleAverages}
              >
                {data.showAverages ? 'Masquer Moyennes' : 'Afficher Moyennes'}
              </button>

              {/* Bouton de reload */}
              <button
                className={`py-2 px-4 rounded-full font-medium shadow flex items-center space-x-2 ${
                  isOnline
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={isOnline ? fetchData : undefined}
                disabled={!isOnline}
              >
                <FiRefreshCw className="text-xl" />
                <span>Recharger</span>
              </button>
            </div>

            {/* Graphique avec données filtrées */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              {data.showDonut ? (
                <DonutChart
                  averages={data.averages}
                  selectedGraph={data.selectedGraph}
                />
              ) : (
                <SensorChart
                  chartData={filteredChartData}
                  selectedGraph={data.selectedGraph}
                  averages={data.averages}
                  showAverages={data.showAverages}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
