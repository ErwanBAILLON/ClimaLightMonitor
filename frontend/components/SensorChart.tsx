import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

interface ChartData {
  timestamp: string; // Format ISO ou timestamp
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

  const formattedChartData = chartData.map(data => ({
    ...data,
    timestamp: new Date(data.timestamp).getTime(),
    temperature: data.temperature || 0,
    humidity: data.humidity || 0,
    luminosity: data.luminosity || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp" 
          domain={['auto', 'auto']} 
          scale="time" 
          type="number"
          tickFormatter={(tick) => new Date(tick).toLocaleString()}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        <Line
          type="monotone"
          dataKey={selectedGraph}
          stroke={graphColorMap[selectedGraph]}
          name={selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)}
        />
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

        <Brush
          dataKey="timestamp"
          height={30}
          stroke="#8884d8"
          tickFormatter={(tick) => new Date(tick).toLocaleString()}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
