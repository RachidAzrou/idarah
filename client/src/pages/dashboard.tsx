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
        <main className="flex-1 py-4">
          <div className="px-4 sm:px-6 lg:px-8 w-full">
            {/* Page Header */}
            <div className="mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-700">Overzicht van jouw moskee ledenbeheer</p>
              </div>
            </div>

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