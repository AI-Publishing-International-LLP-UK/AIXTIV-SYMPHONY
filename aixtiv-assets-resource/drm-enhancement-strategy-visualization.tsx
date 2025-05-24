import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Code, Shield, Zap, Database, Layers } from 'lucide-react';

const EnhancementStrategyVisualization = () => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  const enhancementComponents = [
    {
      name: 'Ethical AI Validation',
      complexity: 85,
      impact: 90,
      icon: <Shield className="text-green-500" />,
      description:
        'Advanced multi-dimensional originality and ethical compliance screening.',
      key_features: [
        'Semantic originality analysis',
        'Contextual bias detection',
        'Nuanced creativity scoring',
      ],
    },
    {
      name: 'Platform Integration',
      complexity: 80,
      impact: 85,
      icon: <Layers className="text-blue-500" />,
      description: 'Intelligent content adaptation across multiple platforms.',
      key_features: [
        'Dynamic content transformation',
        'Platform-specific optimization',
        'Engagement prediction',
      ],
    },
    {
      name: 'Analytics Learning System',
      complexity: 75,
      impact: 80,
      icon: <Database className="text-purple-500" />,
      description:
        'Predictive performance modeling and adaptive user preferences.',
      key_features: [
        'Machine learning-based insights',
        'Personalized recommendations',
        'Privacy-preserving learning',
      ],
    },
    {
      name: 'Content Generation Engine',
      complexity: 90,
      impact: 95,
      icon: <Code className="text-red-500" />,
      description:
        'Enhanced AI-human collaborative content creation framework.',
      key_features: [
        'Advanced contribution balancing',
        'Intelligent suggestion filtering',
        'Creative leadership preservation',
      ],
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Dr. Memoria's Enhancement Strategy
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={enhancementComponents}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const component = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded shadow">
                          <h3 className="font-bold text-lg">
                            {component.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {component.description}
                          </p>
                          <div className="mt-2">
                            <strong>Complexity:</strong> {component.complexity}
                            /100
                            <br />
                            <strong>Impact:</strong> {component.impact}/100
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="complexity"
                  fill="#8884d8"
                  name="Complexity"
                  onClick={data => setSelectedComponent(data)}
                />
                <Bar
                  dataKey="impact"
                  fill="#82ca9d"
                  name="Impact"
                  onClick={data => setSelectedComponent(data)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">
              {selectedComponent ? selectedComponent.name : 'Component Details'}
            </h3>

            {selectedComponent ? (
              <div>
                <p className="text-gray-600 mb-4">
                  {selectedComponent.description}
                </p>

                <div className="flex items-center mb-4">
                  <div className="mr-4">{selectedComponent.icon}</div>
                  <div>
                    <h4 className="font-bold">Key Features:</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {selectedComponent.key_features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong className="block mb-2">Complexity:</strong>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full"
                        style={{ width: `${selectedComponent.complexity}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <strong className="block mb-2">Impact:</strong>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${selectedComponent.impact}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Click on a bar in the chart to see detailed component
                information.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-center">
            Strategic Enhancement Approach
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Ethical AI First</h4>
              <p>
                Prioritize human creativity and ethical considerations in AI
                assistance
              </p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Adaptive Learning</h4>
              <p>
                Continuous improvement through intelligent performance insights
              </p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Platform Flexibility</h4>
              <p>
                Dynamic content adaptation across multiple publishing platforms
              </p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg">
              <h4 className="font-bold mb-2">Transparent Collaboration</h4>
              <p>
                Clear tracking of AI and human contributions in content creation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancementStrategyVisualization;
