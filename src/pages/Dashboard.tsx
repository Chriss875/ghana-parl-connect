import { TrendingUp, TrendingDown, DollarSign, FileText, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useState, useRef, useEffect } from "react";
import { getDashboardForDate, DashboardResponse, KeyMetric } from "@/lib/api";
import MetricCard from '@/components/metrics/MetricCard';
import DATES from "@/data/dates";

const Dashboard = () => {
  // Local state for the dashboard data
  const [dateInput, setDateInput] = useState("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showDatesList, setShowDatesList] = useState(false);
  const [filteredDates, setFilteredDates] = useState<string[]>(DATES);
  
  useEffect(() => {
    if (!dateInput) {
      setFilteredDates(DATES);
    } else {
      const q = dateInput.toLowerCase();
      setFilteredDates(DATES.filter((d) => d.toLowerCase().includes(q)));
    }
  }, [dateInput]);
  const [loading, setLoading] = useState(false);
  const SAMPLE_DASHBOARD: DashboardResponse = {
    date: '2025-07-01',
    session_title: 'Proceedings on the 2025 Budget, Mid-Year Review, and Associated Legislation',
    summary: 'Parliamentary session focused on the Mid-Year Fiscal Policy Review of the 2025 Budget, leading to revisions in revenue and expenditure projections.',
    key_metrics: [
      { label: 'Total Revenue and Grants (Revised)', value: 'GHS 229.9B', change: '+GHS 2.8B', change_type: 'increase', subtitle: 'Fiscal Year 2025', priority: 10 },
      { label: 'Overall Fiscal Balance on Cash Basis', value: '3.8% of GDP', change: '-0.3%', change_type: 'decrease', subtitle: 'Deficit improved from 4.1% of GDP' },
      { label: 'Primary Balance on Commitment Basis', value: '1.5% of GDP', change: '0%', change_type: 'neutral', subtitle: 'Surplus target maintained for 2025' },
      { label: 'Inflation Rate (End of June 2025)', value: '13.7%', change: '-10.1%', change_type: 'decrease', subtitle: 'Down from 23.8% in Dec 2024' },
      { label: 'Projected Reduction in Borrowing Needs', value: 'GHS 4.3B', priority: 5 },
      { label: 'Inherited Arrears Stock', value: 'GHS 67B', subtitle: 'As stated in budget presentation' }
    ],
    spending_by_ministry: [],
    national_project_trends: [],
    budget_allocations: [],
    recent_budget_approvals: [
      { project: 'District Assemblies Common Fund (DACF) Distribution', ministry: 'Local Government', amount: 'GHS 7,510,000,000.00', date: '2025-03-29', status: 'Approved' },
      { project: 'IDA General Budget Support Facility', ministry: 'Finance', amount: 'US$360M', date: '2025-07-24', status: 'Approved' }
    ],
    recent_motion_votes: [],
    bills_passed: ['Appropriations Bill, 2025', 'University for Development Studies Bill, 2025'],
    papers_laid: [
      'Mid-Year Fiscal Policy Review of the 2025 Budget Statement and Economic Policy',
      'Report of the Committee of the Whole on the Proposed Formula for Distributing the District Assemblies Common Fund (DACF) for the Year 2025'
    ]
  };

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(SAMPLE_DASHBOARD);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  return (
  <div className="space-y-6 pb-20 md:pb-6 relative">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Government Spending Overview</h1>
        <p className="text-sm text-muted-foreground">Enter a date (e.g. 1st July 2025) to load the session dashboard for that Hansard entry.</p>
      </div>

      {/* Filters (only date required for dashboard API) */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Date</label>
              <div className="relative">
                <Input
                  ref={dateInputRef}
                  placeholder="e.g. 1st July 2025"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  onFocus={() => setShowDatesList(true)}
                  onBlur={() => setTimeout(() => setShowDatesList(false), 150)}
                  aria-label="Date filter (e.g. 1st July 2025)"
                />
                {showDatesList && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover p-1">
                    {filteredDates.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No dates</div>
                    ) : (
                      filteredDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setDateInput(d);
                            setShowDatesList(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent/20"
                        >
                          {d}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button
                className="w-full"
                onClick={async () => {
                  setError(null);
                  if (!dateInput) {
                    setError("Please enter a date in the format '1st July 2025'.");
                    return;
                  }
                  // Clear previous dashboard data so it's not visible while loading
                  setDashboard(null);
                  setLoading(true);
                  try {
                    const res = await getDashboardForDate({ date: dateInput });
                    setDashboard(res);
                  } catch (err: any) {
                    setError(err?.message || String(err));
                    setDashboard(null);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Loading…" : "Load Dashboard"}
              </Button>
            </div>
          </div>
          {error ? <div className="text-sm text-red-600 mt-2">{error}</div> : null}
        </CardContent>
      </Card>

      {/* Full-page loading overlay: covers the dashboard area so previous data isn't visible while fetching */}
      {loading ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-12 w-12 text-emerald-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <div className="text-emerald-700 font-medium">Loading…</div>
          </div>
        </div>
      ) : null}

      {/* Key Metrics (from backend) */}
      {dashboard ? (
        <section>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{dashboard.session_title}</h2>
              <div className="text-sm text-muted-foreground">Date: {dashboard.date}</div>
            </div>
            <div className="max-w-xl text-right text-sm text-muted-foreground">{dashboard.summary}</div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="rounded-md bg-gray-50 px-3 py-1 text-sm font-medium">{dashboard.key_metrics?.length ?? 0} metrics</div>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => {
              const metrics = (dashboard.key_metrics || []) as any[];
              // sort by priority desc, fallback to original order
              metrics.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
              return metrics.map((m) => <MetricCard key={m.id ?? m.label} metric={m} />);
            })()}
          </div>

          {/* Visualizations */}
          <section className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboard.spending_by_ministry && dashboard.spending_by_ministry.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Spending by Ministry</CardTitle>
                    <CardDescription>Allocation of funds (where available)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dashboard.spending_by_ministry.map((s) => ({ ministry: s.ministry, spending: parseFloat(String(s.amount).replace(/[^0-9.-]+/g, '')) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ministry" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="spending" fill="#006B3F" name="Spending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}

              {dashboard.national_project_trends && dashboard.national_project_trends.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>National Project Trend</CardTitle>
                    <CardDescription>Expenditure over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboard.national_project_trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="expenditure" stroke="#CE1126" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Budget Allocations</CardTitle>
                <CardDescription>Percentage breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard.budget_allocations && dashboard.budget_allocations.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={dashboard.budget_allocations} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={100} dataKey="value">
                        {dashboard.budget_allocations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#006B3F", "#FCD116", "#CE1126", "#0088FE", "#00C49F"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </CardContent>
            </Card>
          </section>

          {/* Recent Approvals Table */}
          <section className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Recent Budget Approvals</h3>
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
                      {(dashboard.recent_budget_approvals || []).map((approval, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-4">{approval.project}</td>
                          <td className="p-4">{approval.ministry}</td>
                          <td className="p-4 font-semibold">{approval.amount}</td>
                          <td className="p-4">{approval.date}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              approval.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
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

          {/* Bills & Papers */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bills Passed</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.bills_passed && dashboard.bills_passed.length > 0 ? (
                  <ul className="list-disc ml-5 space-y-2">
                    {dashboard.bills_passed.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No bills recorded for this session.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Papers Laid</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard.papers_laid && dashboard.papers_laid.length > 0 ? (
                  <ul className="list-disc ml-5 space-y-2">
                    {dashboard.papers_laid.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No papers recorded for this session.</div>
                )}
              </CardContent>
            </Card>
          </section>
        </section>
      ) : null}

      {/* End of page */}
    </div>
  );
};

export default Dashboard;
