import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DonutChartProps {
  averages: { temperature: number; humidity: number; luminosity: number; maxTemperature: number };
  selectedGraph: 'temperature' | 'humidity' | 'luminosity';
}

const COLORS = ['#0088FE', '#FF8042'];

enum GraphType {
  temperature = 'Température',
  humidity = 'Humidité',
  luminosity = 'Luminosité',
}

const switchGraphType = (type: string) => {
  switch (type) {
    case 'temperature':
      return GraphType.temperature;
    case 'humidity':
      return GraphType.humidity;
    case 'luminosity':
      return GraphType.luminosity;
  }
}

export default function DonutChart({ averages, selectedGraph }: DonutChartProps) {
  const maxValues = {
    temperature: averages.maxTemperature,
    humidity: 100,
    luminosity: 1024,
  };

  const data = [
    { name: switchGraphType(selectedGraph), value: parseFloat(averages[selectedGraph].toFixed(2)), color: COLORS[0] },
    { name: 'Restant', value: parseFloat((maxValues[selectedGraph] - averages[selectedGraph]).toFixed(2)), color: COLORS[1] },
  ];

  const percentage = parseFloat(((averages[selectedGraph] / maxValues[selectedGraph]) * 100).toFixed(2));

  const tooltipFormatter = (value: number) => {
    return `${value} (${((value / maxValues[selectedGraph]) * 100).toFixed(2)}%)`;
  };

  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="70%" height={400}>
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
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
        </PieChart>
      </ResponsiveContainer>

      {/* Ajout de la légende avec des pastilles colorées */}
      <div className="ml-8 text-left">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Informations</h3>
        
        {/* Section des pastilles et des informations */}
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center mb-2">
            <span
              className="inline-block w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            ></span>
            <p className="text-lg">
              {entry.name} : <span className="font-bold">{entry.value}</span>
              {entry.name === selectedGraph && (
                <> ({percentage}%)</>
              )}
            </p>
          </div>
        ))}

        {/* Maximum Value Display */}
        <p className="text-lg mt-4">
          Maximum : <span className="font-bold">{maxValues[selectedGraph]}</span>
        </p>
      </div>
    </div>
  );
}
