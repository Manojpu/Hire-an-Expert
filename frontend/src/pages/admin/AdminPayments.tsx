import React from 'react';
import { CreditCard, DollarSign, TrendingUp, Download, Filter, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminPayments = () => {
  // Sample payment data
  const recentTransactions = [
    {
      id: 'TXN001',
      user: 'Alice Johnson',
      expert: 'John Doe',
      service: 'Web Development Consultation',
      amount: 150.00,
      fee: 15.00,
      netAmount: 135.00,
      date: '2024-01-15 2:30 PM',
      status: 'completed',
      type: 'payment'
    },
    {
      id: 'TXN002',
      user: 'Mike Wilson',
      expert: 'Sarah Smith',
      service: 'Digital Marketing Strategy',
      amount: 300.00,
      fee: 30.00,
      netAmount: 270.00,
      date: '2024-01-15 1:15 PM',
      status: 'pending',
      type: 'payment'
    },
    {
      id: 'TXN003',
      user: 'Emma Davis',
      expert: 'David Brown',
      service: 'UI/UX Design Review',
      amount: 200.00,
      fee: 20.00,
      netAmount: 180.00,
      date: '2024-01-14 4:45 PM',
      status: 'refunded',
      type: 'refund'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Payment Management
              </h1>
              <p className="text-slate-600 mt-1">Monitor transactions, fees, and payment analytics</p>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">$45,230</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">+12.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Platform Fees</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">$4,523</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">+8.7%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Payouts</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">$8,150</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDownRight className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">-3.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Transactions Today</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">127</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">+15.4%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Process Payouts
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">Recent Transactions</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Transaction ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Service</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Client</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Expert</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Platform Fee</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="font-mono text-sm text-slate-900">{transaction.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-900">{transaction.service}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700">{transaction.user}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700">{transaction.expert}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-900">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-slate-500">Net: {formatCurrency(transaction.netAmount)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-green-600 font-medium">{formatCurrency(transaction.fee)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-700">{transaction.date}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(transaction.status)}`}>
                        {formatStatus(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Settings</h3>
            <p className="text-slate-600 mb-4">Configure payment methods and fee structures</p>
            <Button className="w-full bg-blue-500 hover:bg-blue-600">
              Manage Settings
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Dispute Resolution</h3>
            <p className="text-slate-600 mb-4">Handle payment disputes and chargebacks</p>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              View Disputes
            </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Reports</h3>
            <p className="text-slate-600 mb-4">Generate detailed financial reports</p>
            <Button className="w-full bg-purple-500 hover:bg-purple-600">
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;