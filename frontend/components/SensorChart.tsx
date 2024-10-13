import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  timestamp: string;
  temperature: number;
  humidity: number;
  luminosity: number;
}

interface SensorChartProps {
  chartData: ChartData[];
  selectedGraph: 'temperature' | 'humidity' | 'luminosity';
  averages: { temperature: number; humidity: number; luminosity: number };
  showAverages: boolean;
}

export default function SensorChart({ chartData, selectedGraph, averages, showAverages }: SensorChartProps) {
  const graphColorMap = {
    temperature: '#8884d8',
    humidity: '#82ca9d',
    luminosity: '#ffc658',
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        {/* Ligne pour la métrique sélectionnée */}
        <Line
          type="monotone"
          dataKey={selectedGraph}
          stroke={graphColorMap[selectedGraph]}
          name={selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)}
        />
        {/* Ligne pour les moyennes si activé */}
        {showAverages && (
          <Line
            type="monotone"
            dataKey={() => averages[selectedGraph]}
            stroke="#ff0000"
            name={`Moyenne ${selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)}`}
            dot={false}
            strokeDasharray="5 5"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
