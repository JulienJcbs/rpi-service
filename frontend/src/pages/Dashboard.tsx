import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cpu, FolderTree, Zap, Activity, ArrowRight } from 'lucide-react';
import { devicesApi, groupsApi, eventsApi } from '../api';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getAll,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getAll,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', 1],
    queryFn: () => eventsApi.getAll(1, 10),
  });

  const onlineDevices = devices.filter((d) => d.isOnline).length;
  const totalTriggers = devices.reduce((acc, d) => acc + (d.triggers?.length || 0), 0);

  const stats = [
    {
      label: 'Devices',
      value: devices.length,
      subValue: `${onlineDevices} en ligne`,
      icon: Cpu,
      color: 'from-raspberry-500 to-pink-600',
      link: '/devices',
    },
    {
      label: 'Groupes',
      value: groups.length,
      icon: FolderTree,
      color: 'from-violet-500 to-purple-600',
      link: '/groups',
    },
    {
      label: 'Triggers',
      value: totalTriggers,
      subValue: 'configurés',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      link: '/devices',
    },
    {
      label: 'Événements',
      value: eventsData?.pagination.total || 0,
      subValue: 'enregistrés',
      icon: Activity,
      color: 'from-emerald-500 to-teal-600',
      link: '/events',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="font-display text-4xl font-bold text-white">
          Tableau de bord
        </h1>
        <p className="text-slate-400">
          Vue d'ensemble de vos Raspberry Pi et de leurs configurations
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Link key={stat.label} to={stat.link}>
            <Card hover className={`stagger-${index + 1} opacity-0 animate-fade-in-up`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                  <p className="font-display text-4xl font-bold text-white mt-2">
                    {stat.value}
                  </p>
                  {stat.subValue && (
                    <p className="text-sm text-slate-500 mt-1">{stat.subValue}</p>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Devices & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <Card className="stagger-5 opacity-0 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-white">
              Devices récents
            </h2>
            <Link
              to="/devices"
              className="text-sm text-raspberry-400 hover:text-raspberry-300 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {devices.slice(0, 5).map((device) => (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-raspberry-500/20 to-raspberry-600/20 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-raspberry-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{device.name}</p>
                    <p className="text-sm text-slate-500">
                      {device.triggers?.length || 0} trigger(s)
                    </p>
                  </div>
                </div>
                <StatusBadge online={device.isOnline} />
              </Link>
            ))}
            {devices.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Aucun device configuré
              </p>
            )}
          </div>
        </Card>

        {/* Recent Events */}
        <Card className="stagger-5 opacity-0 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-white">
              Activité récente
            </h2>
            <Link
              to="/events"
              className="text-sm text-raspberry-400 hover:text-raspberry-300 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {eventsData?.events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
              >
                <div
                  className={`w-2 h-2 mt-2 rounded-full ${
                    event.type === 'trigger_fired'
                      ? 'bg-amber-400'
                      : event.type === 'action_executed'
                      ? 'bg-emerald-400'
                      : event.type === 'device_connected'
                      ? 'bg-blue-400'
                      : 'bg-slate-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{event.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(event.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
            {(!eventsData?.events || eventsData.events.length === 0) && (
              <p className="text-center text-slate-500 py-8">
                Aucun événement récent
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}



