import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Zap, Play, Wifi, WifiOff, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { eventsApi, devicesApi } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [deviceFilter, setDeviceFilter] = useState('');
  const limit = 20;

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', page],
    queryFn: () => eventsApi.getAll(page, limit),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getAll,
  });

  const events = eventsData?.events || [];
  const pagination = eventsData?.pagination;

  const filteredEvents = deviceFilter
    ? events.filter((e) => e.deviceId === deviceFilter)
    : events;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'trigger_fired': return Zap;
      case 'action_executed': return Play;
      case 'device_connected': return Wifi;
      case 'device_disconnected': return WifiOff;
      case 'device_error': return AlertCircle;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'trigger_fired': return 'text-amber-400 bg-amber-500/20';
      case 'action_executed': return 'text-emerald-400 bg-emerald-500/20';
      case 'device_connected': return 'text-blue-400 bg-blue-500/20';
      case 'device_disconnected': return 'text-slate-400 bg-slate-500/20';
      case 'device_error': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'trigger_fired': return 'Trigger';
      case 'action_executed': return 'Action';
      case 'device_connected': return 'Connexion';
      case 'device_disconnected': return 'Déconnexion';
      case 'device_error': return 'Erreur';
      default: return type;
    }
  };

  const getDeviceName = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    return device?.name || 'Device inconnu';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold text-white">Événements</h1>
          <p className="text-slate-400 mt-2">
            Historique des activités de vos devices
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Filtrer par device:</span>
          <Select
            options={[
              { value: '', label: 'Tous les devices' },
              ...devices.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="w-48"
          />
          {pagination && (
            <div className="ml-auto text-sm text-slate-500">
              {pagination.total} événement(s) au total
            </div>
          )}
        </div>
      </Card>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <Card className="divide-y divide-white/5">
          {filteredEvents.map((event, index) => {
            const Icon = getEventIcon(event.type);
            const colorClass = getEventColor(event.type);
            const [iconColor, bgColor] = colorClass.split(' ');

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className={`p-2.5 rounded-xl ${bgColor}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bgColor} ${iconColor}`}>
                      {getEventLabel(event.type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {getDeviceName(event.deviceId)}
                    </span>
                  </div>
                  <p className="text-white">{event.message}</p>
                  {event.metadata && (
                    <pre className="mt-2 text-xs text-slate-500 font-mono bg-white/5 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(JSON.parse(event.metadata), null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm text-slate-400">
                    {new Date(event.createdAt).toLocaleTimeString('fr-FR')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {new Date(event.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </Card>
      ) : (
        <Card className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun événement enregistré</p>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="text-sm text-slate-400">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}



