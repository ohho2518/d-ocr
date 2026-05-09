import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Upload, TrendingUp, TrendingDown, DollarSign, FileText } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Fetch analytics data
  const { data: summary } = trpc.analytics.summary.useQuery({ month: undefined }, {
    enabled: isAuthenticated,
  });

  const { data: monthlyBreakdown } = trpc.analytics.monthlyBreakdown.useQuery(void 0, {
    enabled: isAuthenticated,
  });

  const { data: categoryBreakdown } = trpc.analytics.categoryBreakdown.useQuery({ month: undefined }, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="wireframe-cyan text-center">
            <div className="mb-6">
              <div className="text-5xl font-black text-foreground mb-2">
                💰 OCR Finance
              </div>
              <p className="text-muted-foreground text-sm label-mono">
                Intelligent Financial Document Processing
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="text-left space-y-2">
                <p className="text-sm font-semibold">Features:</p>
                <ul className="text-xs space-y-1 label-mono">
                  <li>✓ AI-powered OCR (Thai & English)</li>
                  <li>✓ Automatic transaction extraction</li>
                  <li>✓ Smart categorization</li>
                  <li>✓ Real-time analytics</li>
                </ul>
              </div>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg py-8">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-foreground mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground label-mono">
            Manage your finances with AI-powered document processing
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => navigate("/upload")}
            className="h-auto py-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 justify-start"
          >
            <Upload className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Upload Document</div>
              <div className="text-xs opacity-75">Receipt, Bill, or Bank Statement</div>
            </div>
          </Button>

          <Button
            onClick={() => navigate("/transactions")}
            className="h-auto py-4 bg-primary text-primary-foreground hover:bg-primary/90 justify-start"
          >
            <FileText className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">View Transactions</div>
              <div className="text-xs opacity-75">All extracted data</div>
            </div>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="wireframe-cyan p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground mb-2">Total Income</p>
                <p className="text-3xl font-black data-mono">
                  ฿{summary?.totalIncome?.toLocaleString("th-TH", { maximumFractionDigits: 2 }) || "0.00"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="wireframe-pink p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground mb-2">Total Expense</p>
                <p className="text-3xl font-black data-mono">
                  ฿{summary?.totalExpense?.toLocaleString("th-TH", { maximumFractionDigits: 2 }) || "0.00"}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-secondary opacity-50" />
            </div>
          </Card>

          <Card className="border-2 border-dashed border-foreground/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground mb-2">Balance</p>
                <p className="text-3xl font-black data-mono">
                  ฿{summary?.balance?.toLocaleString("th-TH", { maximumFractionDigits: 2 }) || "0.00"}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-foreground opacity-50" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Breakdown Chart */}
          <Card className="wireframe-cyan p-6">
            <h3 className="text-lg font-black text-foreground mb-4">Monthly Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 100% 70% / 0.3)" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "2px dashed hsl(200 100% 70%)",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="hsl(200 100% 70%)" name="Income" />
                <Bar dataKey="expense" fill="hsl(330 100% 80%)" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Breakdown Pie Chart */}
          <Card className="wireframe-pink p-6">
            <h3 className="text-lg font-black text-foreground mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown || []}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill="hsl(200 100% 70%)" />
                  <Cell fill="hsl(330 100% 80%)" />
                  <Cell fill="hsl(200 100% 65%)" />
                  <Cell fill="hsl(330 100% 75%)" />
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "2px dashed hsl(330 100% 80%)",
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-2 border-dashed border-foreground/20 p-6">
          <h3 className="text-lg font-black text-foreground mb-4">Getting Started</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-primary font-black text-lg">1</div>
              <div>
                <p className="font-semibold">Upload Your First Document</p>
                <p className="text-sm text-muted-foreground">
                  Click "Upload Document" to add a receipt, bill, or bank statement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-secondary font-black text-lg">2</div>
              <div>
                <p className="font-semibold">AI Extracts Data Automatically</p>
                <p className="text-sm text-muted-foreground">
                  Our OCR system reads Thai & English text and extracts transactions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-primary font-black text-lg">3</div>
              <div>
                <p className="font-semibold">Review & Categorize</p>
                <p className="text-sm text-muted-foreground">
                  Verify extracted data and assign categories for better insights
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
