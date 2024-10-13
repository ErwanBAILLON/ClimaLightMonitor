import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  averages: { temperature: number; humidity: number; luminosity: number; maxTemperature: number };
  selectedGraph: 'temperature' | 'humidity' | 'luminosity';
}

const COLORS = ['#0088FE', '#FF8042'];

export default function DonutChart({ averages, selectedGraph }: DonutChartProps) {
  const maxValues = {
    temperature: averages.maxTemperature, // Comparer à la température maximale
    humidity: 100, // L'humidité est comparée à 100%
    luminosity: 1024, // La luminosité est comparée à 1024
  };

  const data = [
    { name: selectedGraph, value: averages[selectedGraph] },
    { name: 'Remaining', value: maxValues[selectedGraph] - averages[selectedGraph] },
  ];

  const tooltipFormatter = (value: number) => {
    // Format le tooltip pour donner des informations claires
    return `${value} (${((value / maxValues[selectedGraph]) * 100).toFixed(2)}%)`;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={100}
          outerRadius={150}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        {/* Ajout du Tooltip */}
        <Tooltip formatter={tooltipFormatter} />
      </PieChart>
    </ResponsiveContainer>
  );
}
