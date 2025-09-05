import ModernKpiCards from "@/components/dashboard/modern-kpi-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import PaymentStatusChart from "@/components/dashboard/payment-status-chart";
import RevenueByCategoryChart from "@/components/dashboard/revenue-by-category";
import MembersByCategoryChart from "@/components/dashboard/members-by-category";
import AgeGenderChart from "@/components/dashboard/age-gender-chart";
import RecentActivities from "@/components/dashboard/recent-activities";
import DueDates from "@/components/dashboard/due-dates";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
        <main className="flex-1">
          {/* Fixed Page Header */}
          <div className="sticky top-0 z-30 bg-background border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight" data-testid="page-title">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600 font-medium">Overzicht van jouw moskee ledenbeheer</p>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 lg:px-8 w-full pt-4">

            {/* KPI Cards - 6 kaarten in een grid */}
            <ModernKpiCards />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <RevenueChart />
              <PaymentStatusChart />
            </div>

            {/* Revenue by Category - Full width */}
            <div className="mb-6">
              <RevenueByCategoryChart />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <div className="xl:col-span-2">
                <MembersByCategoryChart />
              </div>
              <AgeGenderChart />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <DueDates />
              <RecentActivities />
            </div>
          </div>
        </main>
  );
}