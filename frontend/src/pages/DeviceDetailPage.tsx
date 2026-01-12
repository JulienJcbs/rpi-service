import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Cpu,
  Plus,
  Zap,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Timer,
} from 'lucide-react';
import { devicesApi, triggersApi, actionsApi } from '../api';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import type { Trigger, Action } from '../types';

const triggerTypeOptions = [
  { value: 'gpio_input', label: 'Entrée GPIO' },
  { value: 'schedule', label: 'Planifié' },
  { value: 'api_call', label: 'Appel API' },
];

const actionTypeOptions = [
  { value: 'gpio_output', label: 'Sortie GPIO' },
  { value: 'http_request', label: 'Requête HTTP' },
  { value: 'delay', label: 'Délai' },
];

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedTrigger, setExpandedTrigger] = useState<string | null>(null);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null);
  const [triggerType, setTriggerType] = useState('gpio_input');
  const [actionType, setActionType] = useState('gpio_output');

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: () => devicesApi.getById(id!),
    enabled: !!id,
  });

  const createTriggerMutation = useMutation({
    mutationFn: triggersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', id] });
      setIsTriggerModalOpen(false);
    },
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: triggersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', id] });
    },
  });

  const fireTriggerMutation = useMutation({
    mutationFn: triggersApi.fire,
  });

  const createActionMutation = useMutation({
    mutationFn: actionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', id] });
      setIsActionModalOpen(false);
      setSelectedTriggerId(null);
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: actionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device', id] });
    },
  });

  const handleTriggerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let config: Record<string, unknown> = {};

    if (triggerType === 'gpio_input') {
      config = {
        pin: parseInt(formData.get('pin') as string),
        edge: formData.get('edge') || 'falling',
        pull: formData.get('pull') || 'up',
        debounce: parseInt(formData.get('debounce') as string) || 50,
      };
    } else if (triggerType === 'schedule') {
      config = {
        cron: formData.get('cron'),
        timezone: 'Europe/Paris',
      };
    }

    createTriggerMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      type: triggerType,
      config,
      deviceId: id!,
    });
  };

  const handleActionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let config: Record<string, unknown> = {};

    if (actionType === 'gpio_output') {
      config = {
        pin: parseInt(formData.get('pin') as string),
        state: formData.get('state') || 'high',
        duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined,
      };
    } else if (actionType === 'http_request') {
      config = {
        url: formData.get('url'),
        method: formData.get('method') || 'POST',
      };
    } else if (actionType === 'delay') {
      config = {
        duration: parseInt(formData.get('duration') as string),
      };
    }

    createActionMutation.mutate({
      name: formData.get('name') as string,
      type: actionType,
      config,
      triggerId: selectedTriggerId!,
    });
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'gpio_input': return Zap;
      case 'schedule': return Clock;
      case 'api_call': return Globe;
      default: return Zap;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'gpio_output': return Zap;
      case 'http_request': return Globe;
      case 'delay': return Timer;
      default: return Zap;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!device) {
    return (
      <Card>
        <p className="text-slate-400">Device non trouvé</p>
        <Link to="/devices" className="text-raspberry-400 hover:text-raspberry-300 mt-4 inline-block">
          Retour aux devices
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/devices"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux devices
        </Link>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-raspberry-500/20 to-raspberry-600/20 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-raspberry-400" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                {device.name}
              </h1>
              {device.description && (
                <p className="text-slate-400 mt-1">{device.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <StatusBadge online={device.isOnline} />
                {device.hostname && (
                  <span className="text-sm font-mono text-slate-500">
                    {device.hostname}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="font-mono text-xs text-slate-600 bg-white/5 px-3 py-2 rounded-lg">
            ID: {device.id}
          </div>
        </motion.div>
      </div>

      {/* Triggers Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold text-white">
            Triggers & Actions
          </h2>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsTriggerModalOpen(true)}
          >
            Nouveau Trigger
          </Button>
        </div>

        {device.triggers && device.triggers.length > 0 ? (
          <div className="space-y-4">
            {device.triggers.map((trigger: Trigger) => {
              const TriggerIcon = getTriggerIcon(trigger.type);
              const isExpanded = expandedTrigger === trigger.id;
              const config = JSON.parse(trigger.config);

              return (
                <Card key={trigger.id} className="overflow-hidden">
                  {/* Trigger Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedTrigger(isExpanded ? null : trigger.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${trigger.isEnabled ? 'bg-amber-500/20' : 'bg-slate-500/20'}`}>
                        <TriggerIcon className={`w-5 h-5 ${trigger.isEnabled ? 'text-amber-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{trigger.name}</h3>
                        <p className="text-sm text-slate-400">
                          {trigger.type === 'gpio_input' && `GPIO ${config.pin} • ${config.edge}`}
                          {trigger.type === 'schedule' && `Cron: ${config.cron}`}
                          {trigger.type === 'api_call' && 'Appel API'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Play className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          fireTriggerMutation.mutate(trigger.id);
                        }}
                      >
                        Tester
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer ce trigger ?')) {
                            deleteTriggerMutation.mutate(trigger.id);
                          }
                        }}
                      >
                        Supprimer
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 pt-6 border-t border-white/5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-300">Actions</h4>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Plus className="w-4 h-4" />}
                          onClick={() => {
                            setSelectedTriggerId(trigger.id);
                            setIsActionModalOpen(true);
                          }}
                        >
                          Ajouter une action
                        </Button>
                      </div>

                      {trigger.actions && trigger.actions.length > 0 ? (
                        <div className="space-y-2">
                          {trigger.actions.map((action: Action, index: number) => {
                            const ActionIcon = getActionIcon(action.type);
                            const actionConfig = JSON.parse(action.config);

                            return (
                              <div
                                key={action.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
                              >
                                <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                  <ActionIcon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-white">{action.name}</p>
                                  <p className="text-sm text-slate-400">
                                    {action.type === 'gpio_output' && `GPIO ${actionConfig.pin} → ${actionConfig.state}${actionConfig.duration ? ` (${actionConfig.duration}ms)` : ''}`}
                                    {action.type === 'http_request' && `${actionConfig.method} ${actionConfig.url}`}
                                    {action.type === 'delay' && `Attendre ${actionConfig.duration}ms`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm('Supprimer cette action ?')) {
                                      deleteActionMutation.mutate(action.id);
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm py-4 text-center">
                          Aucune action configurée
                        </p>
                      )}
                    </motion.div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Aucun trigger configuré</p>
            <p className="text-sm text-slate-500 mt-2">
              Créez un trigger pour définir quand déclencher des actions
            </p>
            <Button
              className="mt-4"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsTriggerModalOpen(true)}
            >
              Créer un trigger
            </Button>
          </Card>
        )}
      </div>

      {/* Trigger Modal */}
      <Modal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        title="Nouveau Trigger"
        size="lg"
      >
        <form onSubmit={handleTriggerSubmit} className="space-y-4">
          <Input
            label="Nom"
            name="name"
            required
            placeholder="Bouton principal"
          />
          <Input
            label="Description"
            name="description"
            placeholder="Description optionnelle"
          />
          <Select
            label="Type"
            name="type"
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            options={triggerTypeOptions}
          />

          {/* GPIO Input Config */}
          {triggerType === 'gpio_input' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5">
              <Input
                label="Pin GPIO"
                name="pin"
                type="number"
                min="0"
                max="40"
                required
                placeholder="17"
              />
              <Select
                label="Détection"
                name="edge"
                options={[
                  { value: 'rising', label: 'Front montant' },
                  { value: 'falling', label: 'Front descendant' },
                  { value: 'both', label: 'Les deux' },
                ]}
              />
              <Select
                label="Pull"
                name="pull"
                options={[
                  { value: 'up', label: 'Pull-up' },
                  { value: 'down', label: 'Pull-down' },
                  { value: 'none', label: 'Aucun' },
                ]}
              />
              <Input
                label="Debounce (ms)"
                name="debounce"
                type="number"
                min="0"
                defaultValue="50"
              />
            </div>
          )}

          {/* Schedule Config */}
          {triggerType === 'schedule' && (
            <div className="p-4 rounded-xl bg-white/5">
              <Input
                label="Expression Cron"
                name="cron"
                required
                placeholder="0 8 * * *"
              />
              <p className="text-xs text-slate-500 mt-2">
                Format: minute heure jour mois jour_semaine
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsTriggerModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setSelectedTriggerId(null);
        }}
        title="Nouvelle Action"
        size="lg"
      >
        <form onSubmit={handleActionSubmit} className="space-y-4">
          <Input
            label="Nom"
            name="name"
            required
            placeholder="Activer le relais"
          />
          <Select
            label="Type"
            name="type"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            options={actionTypeOptions}
          />

          {/* GPIO Output Config */}
          {actionType === 'gpio_output' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5">
              <Input
                label="Pin GPIO"
                name="pin"
                type="number"
                min="0"
                max="40"
                required
                placeholder="24"
              />
              <Select
                label="État"
                name="state"
                options={[
                  { value: 'high', label: 'HIGH' },
                  { value: 'low', label: 'LOW' },
                  { value: 'toggle', label: 'Toggle' },
                ]}
              />
              <div className="col-span-2">
                <Input
                  label="Durée (ms, optionnel pour pulse)"
                  name="duration"
                  type="number"
                  min="0"
                  placeholder="Laisser vide pour état permanent"
                />
              </div>
            </div>
          )}

          {/* HTTP Request Config */}
          {actionType === 'http_request' && (
            <div className="p-4 rounded-xl bg-white/5 space-y-4">
              <Input
                label="URL"
                name="url"
                type="url"
                required
                placeholder="https://api.example.com/webhook"
              />
              <Select
                label="Méthode"
                name="method"
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
            </div>
          )}

          {/* Delay Config */}
          {actionType === 'delay' && (
            <div className="p-4 rounded-xl bg-white/5">
              <Input
                label="Durée (ms)"
                name="duration"
                type="number"
                min="0"
                required
                placeholder="1000"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsActionModalOpen(false);
                setSelectedTriggerId(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



