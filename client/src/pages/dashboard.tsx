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
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-700">Overzicht van jouw moskee ledenbeheer</p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link href="/leden">
                  <Button className="inline-flex items-center gap-x-2 rounded-lg px-4 py-2" data-testid="button-new-member">
                    <Plus className="h-4 w-4" />
                    Nieuw Lid
                  </Button>
                </Link>
              </div>
            </div>

            {/* KPI Cards - 6 kaarten in een grid */}
            <ModernKpiCards />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RevenueChart />
              <PaymentStatusChart />
            </div>

            {/* Revenue by Category - Full width */}
            <div className="mb-6">
              <RevenueByCategoryChart />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <MembersByCategoryChart />
              </div>
              <AgeGenderChart />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DueDates />
              {/* Placeholder voor toekomstige content */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    Ruimte voor aanvullende widgets
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities - Full width at bottom */}
            <div className="mb-6">
              <RecentActivities />
            </div>
          </div>
        </main>
  );
}