import React, { useState } from 'react';
import { Brain, Database, Upload, Search, Settings, Zap, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminRAGSystem = () => {
  const [activeTab, setActiveTab] = useState('knowledge-base');

  // Sample knowledge base data
  const knowledgeBaseStats = [
    { label: 'Total Documents', value: '1,247', icon: FileText, color: 'blue' },
    { label: 'Categories', value: '23', icon: Database, color: 'green' },
    { label: 'AI Queries Today', value: '156', icon: MessageSquare, color: 'purple' },
    { label: 'System Accuracy', value: '94.2%', icon: BarChart3, color: 'orange' }
  ];

  const recentDocuments = [
    {
      id: 1,
      title: 'Web Development Best Practices',
      category: 'Programming',
      status: 'processed',
      uploadedAt: '2024-01-15 10:30 AM',
      size: '2.4 MB'
    },
    {
      id: 2,
      title: 'Digital Marketing Strategies 2024',
      category: 'Marketing',
      status: 'processing',
      uploadedAt: '2024-01-15 09:15 AM',
      size: '1.8 MB'
    },
    {
      id: 3,
      title: 'UI/UX Design Guidelines',
      category: 'Design',
      status: 'processed',
      uploadedAt: '2024-01-14 04:20 PM',
      size: '3.1 MB'
    }
  ];

  const recentQueries = [
    {
      id: 1,
      query: 'How to optimize React performance?',
      category: 'Programming',
      accuracy: 96,
      responseTime: '1.2s',
      timestamp: '2024-01-15 2:45 PM'
    },
    {
      id: 2,
      query: 'Best practices for social media marketing',
      category: 'Marketing',
      accuracy: 91,
      responseTime: '0.8s',
      timestamp: '2024-01-15 2:30 PM'
    },
    {
      id: 3,
      query: 'Color theory in web design',
      category: 'Design',
      accuracy: 89,
      responseTime: '1.5s',
      timestamp: '2024-01-15 2:15 PM'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const tabs = [
    { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
    { id: 'ai-queries', label: 'AI Queries', icon: MessageSquare },
    { id: 'system-config', label: 'System Config', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                RAG System Management
              </h1>
              <p className="text-slate-600 mt-1">Manage knowledge base and AI-powered assistance</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {knowledgeBaseStats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              orange: 'bg-orange-100 text-orange-600'
            };
            
            return (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge-base' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Documents
                    </Button>
                    <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Reprocess All
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Document</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Size</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Uploaded</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-100">
                                <FileText className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-slate-900">{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{doc.category}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{doc.size}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{doc.uploadedAt}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Queries Tab */}
            {activeTab === 'ai-queries' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Search queries..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    Export Analytics
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Query</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Accuracy</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Response Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentQueries.map((query) => (
                        <tr key={query.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-100">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="font-medium text-slate-900 max-w-md truncate">{query.query}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{query.category}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${getAccuracyColor(query.accuracy)}`}>
                              {query.accuracy}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{query.responseTime}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-700">{query.timestamp}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* System Config Tab */}
            {activeTab === 'system-config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      AI Model Configuration
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Model Version</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>GPT-4 Turbo</option>
                          <option>GPT-4</option>
                          <option>GPT-3.5 Turbo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Temperature</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="1" 
                          step="0.1" 
                          defaultValue="0.3"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Tokens</label>
                        <input 
                          type="number" 
                          defaultValue="1000"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Vector Database Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Embedding Model</label>
                        <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>text-embedding-ada-002</option>
                          <option>text-embedding-3-small</option>
                          <option>text-embedding-3-large</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Similarity Threshold</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="1" 
                          step="0.01" 
                          defaultValue="0.7"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Max Results</label>
                        <input 
                          type="number" 
                          defaultValue="5"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                    Save Configuration
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRAGSystem;