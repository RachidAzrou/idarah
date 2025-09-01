import KpiCards from "@/components/dashboard/kpi-cards";
import RecentMembers from "@/components/dashboard/recent-members";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Download, Monitor } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-700">Overzicht van jouw moskee ledenbeheer</p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link href="/leden">
                  <Button className="inline-flex items-center gap-x-2 rounded-2xl px-6 py-3" data-testid="button-new-member">
                    <Plus className="h-4 w-4" />
                    Nieuw Lid
                  </Button>
                </Link>
              </div>
            </div>

            {/* KPI Cards */}
            <KpiCards />

            {/* Charts and Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Revenue Chart */}
              <Card>
                <CardHeader className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Inkomsten Overzicht</h3>
                  <p className="text-sm text-gray-500">Laatste 12 maanden</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 text-sm" data-testid="revenue-chart-placeholder">
                    Grafiek: Maandelijkse inkomsten trend
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Betaalstatus</h3>
                  <p className="text-sm text-gray-500">Huidige maand overzicht</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Betaald</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900" data-testid="paid-count">91.6%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">In afwachting</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900" data-testid="pending-count">5.6%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">Achterstallig</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900" data-testid="overdue-count">2.8%</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 h-32 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 text-sm" data-testid="payment-chart-placeholder">
                    Donut grafiek: Verdeling betaalstatus
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Members Table */}
            <RecentMembers />

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/card">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-digital-cards">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-gray-900">Digitale Kaarten</h3>
                        <p className="text-xs text-gray-500 mt-1">Beheer en genereer lidkaarten</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/financien">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-sepa-export">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                          <Download className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-gray-900">SEPA Export</h3>
                        <p className="text-xs text-gray-500 mt-1">Genereer betalingsbestanden</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/publieke-schermen">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-public-screens">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                          <Monitor className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-semibold text-gray-900">Publieke Schermen</h3>
                        <p className="text-xs text-gray-500 mt-1">Beheer informatiedisplays</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
  );
}
