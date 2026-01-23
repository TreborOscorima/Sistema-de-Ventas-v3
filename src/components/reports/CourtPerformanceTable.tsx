import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy } from "lucide-react";

interface CourtData {
  courtId: string;
  courtName: string;
  sportType: string;
  reservations: number;
  revenue: number;
}

interface CourtPerformanceTableProps {
  data: CourtData[];
  loading?: boolean;
}

const SPORT_LABELS: Record<string, string> = {
  'futbol': 'Fútbol',
  'basquet': 'Básquet',
  'tenis': 'Tenis',
  'padel': 'Pádel',
  'voley': 'Vóley',
  'otro': 'Otro'
};

const SPORT_COLORS: Record<string, string> = {
  'futbol': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'basquet': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'tenis': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'padel': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'voley': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export function CourtPerformanceTable({ data, loading }: CourtPerformanceTableProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rendimiento por Cancha
          </CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rendimiento por Cancha
          </CardTitle>
          <CardDescription>Reservas e ingresos por cancha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay datos de reservas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(c => c.revenue));
  const totalReservations = data.reduce((sum, c) => sum + c.reservations, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Rendimiento por Cancha
        </CardTitle>
        <CardDescription>Ordenado por ingresos generados</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Cancha</TableHead>
              <TableHead>Deporte</TableHead>
              <TableHead className="text-right">Reservas</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((court, index) => (
              <TableRow key={court.courtId}>
                <TableCell>
                  {index === 0 ? (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      {index + 1}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{court.courtName}</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${(court.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary"
                    className={SPORT_COLORS[court.sportType] || ''}
                  >
                    {SPORT_LABELS[court.sportType] || court.sportType}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {court.reservations}
                  <span className="text-muted-foreground text-xs ml-1">
                    ({((court.reservations / totalReservations) * 100).toFixed(0)}%)
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(court.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
