import { TrendingUp, TrendingDown, DollarSign, FileText, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const Dashboard = () => {
  // Sample data for charts
  const spendingByMinistry = [
    { ministry: "Education", spending: 35, budget: 40 },
    { ministry: "Health", spending: 29, budget: 31 },
    { ministry: "Infrastructure", spending: 20, budget: 25 },
    { ministry: "Agriculture", spending: 12, budget: 14 },
    { ministry: "Defence", spending: 8, budget: 9 }
  ];

  const projectTrend = [
    { year: "2020", expenditure: 65 },
    { year: "2021", expenditure: 72 },
    { year: "2022", expenditure: 68 },
    { year: "2023", expenditure: 85 },
    { year: "2024", expenditure: 92 }
  ];

  const budgetAllocation = [
    { name: "Infrastructure", value: 30, color: "#006B3F" },
    { name: "Education", value: 25, color: "#FCD116" },
    { name: "Health", value: 20, color: "#CE1126" },
    { name: "Administration", value: 15, color: "#0088FE" },
    { name: "Social Welfare", value: 10, color: "#00C49F" }
  ];

  const recentApprovals = [
    {
      project: "Accra-Kumasi Highway Expansion",
      ministry: "Infrastructure",
      amount: "GHS 5.2B",
      date: "2024-03-15",
      status: "Approved"
    },
    {
      project: "Free Senior High School Initiative",
      ministry: "Education",
      amount: "GHS 3.1B",
      date: "2024-03-10",
      status: "Approved"
    },
    {
      project: "National Health Insurance Scheme Modernization",
      ministry: "Health",
      amount: "GHS 1.8B",
      date: "2024-02-28",
      status: "Approved"
    },
    {
      project: "Digitization of Land Records",
      ministry: "Lands & Natural Resources",
      amount: "GHS 0.9B",
      date: "2024-02-20",
      status: "Pending"
    },
    {
      project: "Coastal Erosion Protection Project",
      ministry: "Environment",
      amount: "GHS 1.5B",
      date: "2024-02-18",
      status: "Approved"
    }
  ];

  const metrics = [
    {
      title: "Total Spending (FY 2023)",
      value: "GHS 150.3B",
      change: "+4.5% from last year",
      trend: "up",
      icon: DollarSign
    },
    {
      title: "Fiscal Deficit (Q1 2024)",
      value: "GHS 12.8B",
      change: "+1.2% from Q4 2023",
      trend: "up",
      icon: TrendingUp
    },
    {
      title: "Projects Funded (2024)",
      value: "2,145",
      change: "Up from 1,890 last year",
      trend: "up",
      icon: FileText
    },
    {
      title: "Budget Utilization Rate (Q1 2024)",
      value: "78.2%",
      change: "+0.7% from target",
      trend: "up",
      icon: Target
    }
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Government Spending Overview
        </h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select defaultValue="2024">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ministry</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ministries</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input placeholder="Search projects or reports..." />
            </div>
          </div>
          <Button className="mt-4">Apply Filters</Button>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs">{metric.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                      <div className={`text-xs flex items-center gap-1 mt-1 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {metric.change}
                      </div>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Spending Visualizations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Spending Visualizations</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Ministry */}
          <Card>
            <CardHeader>
              <CardTitle>Spending by Ministry</CardTitle>
              <CardDescription>Allocation of funds across top ministries</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingByMinistry}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ministry" />
                  <YAxis label={{ value: 'Bn', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="spending" fill="#006B3F" name="Spending (GHS Bn)" />
                  <Bar dataKey="budget" fill="#CE1126" name="Budget (GHS Bn)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* National Project Trend */}
          <Card>
            <CardHeader>
              <CardTitle>National Project Trend</CardTitle>
              <CardDescription>Expenditure on projects over the last 5 years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis label={{ value: 'Bn', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="expenditure" 
                    stroke="#CE1126" 
                    strokeWidth={2}
                    name="Expenditure (GHS Bn)"
                    dot={{ fill: '#CE1126', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Budget Allocations */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Allocations</CardTitle>
            <CardDescription>Percentage breakdown by category for the current fiscal year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* Recent Budget Approvals */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Budget Approvals</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">Project</th>
                    <th className="text-left p-4 font-semibold">Ministry</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Date</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApprovals.map((approval, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4">{approval.project}</td>
                      <td className="p-4">{approval.ministry}</td>
                      <td className="p-4 font-semibold">{approval.amount}</td>
                      <td className="p-4">{approval.date}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          approval.status === 'Approved' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {approval.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
