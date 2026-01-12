import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Cpu, MoreVertical, Trash2, Edit, Copy } from "lucide-react";
import { devicesApi, groupsApi } from "../api";
import Card from "../components/Card";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Select from "../components/Select";
import type { Device } from "../types";

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>("");

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: devicesApi.getAll,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: devicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Device> }) =>
      devicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setIsModalOpen(false);
      setEditingDevice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: devicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      groupId: (formData.get("groupId") as string) || null,
    };

    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredDevices = filterGroup
    ? devices.filter((d) => d.groupId === filterGroup)
    : devices;

  // Group devices by group
  const devicesByGroup = filteredDevices.reduce((acc, device) => {
    const groupId = device.groupId || "ungrouped";
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(device);
    return acc;
  }, {} as Record<string, Device[]>);

  const copyDeviceId = (id: string) => {
    navigator.clipboard.writeText(id);
    setMenuOpen(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl font-bold text-white">
            Devices
          </h1>
          <p className="text-slate-400 mt-2">
            Gérez vos Raspberry Pi connectés
          </p>
        </motion.div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nouveau Device
        </Button>
      </div>

      {/* Filter */}
      <Card className="py-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Filtrer par groupe:</span>
          <Select
            options={[
              { value: "", label: "Tous les groupes" },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
              { value: "ungrouped", label: "Sans groupe" },
            ]}
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Devices Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(devicesByGroup).map(([groupId, groupDevices]) => {
            const group = groups.find((g) => g.id === groupId);
            return (
              <div key={groupId}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group?.color || "#64748b" }}
                  />
                  <h2 className="font-display text-lg font-semibold text-white">
                    {group?.name || "Sans groupe"}
                  </h2>
                  <span className="text-sm text-slate-500">
                    ({groupDevices.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupDevices.map((device, index) => (
                    <motion.div
                      key={device.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover className="relative group">
                        {/* Menu */}
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() =>
                              setMenuOpen(
                                menuOpen === device.id ? null : device.id
                              )
                            }
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpen === device.id && (
                            <div className="absolute right-0 mt-2 w-48 glass rounded-xl py-2 shadow-xl z-10">
                              <button
                                onClick={() => copyDeviceId(device.id)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Copy className="w-4 h-4" /> Copier l'ID
                              </button>
                              <button
                                onClick={() => {
                                  setEditingDevice(device);
                                  setIsModalOpen(true);
                                  setMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" /> Modifier
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Supprimer ce device ?")) {
                                    deleteMutation.mutate(device.id);
                                  }
                                  setMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>

                        <Link to={`/devices/${device.id}`}>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-raspberry-500/20 to-raspberry-600/20 flex items-center justify-center">
                              <Cpu className="w-6 h-6 text-raspberry-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white truncate">
                                {device.name}
                              </h3>
                              {device.description && (
                                <p className="text-sm text-slate-400 truncate mt-1">
                                  {device.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <StatusBadge online={device.isOnline} />
                            <span className="text-sm text-slate-500">
                              {device.triggers?.length || 0} trigger(s)
                            </span>
                          </div>

                          {device.hostname && (
                            <div className="mt-3 text-xs font-mono text-slate-500">
                              {device.hostname} • {device.ipAddress}
                            </div>
                          )}
                        </Link>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredDevices.length === 0 && (
            <Card className="text-center py-12">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucun device trouvé</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setIsModalOpen(true)}
              >
                Créer un device
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDevice(null);
        }}
        title={editingDevice ? "Modifier le device" : "Nouveau device"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            name="name"
            defaultValue={editingDevice?.name}
            required
            placeholder="Mon Raspberry Pi"
          />
          <Input
            label="Description"
            name="description"
            defaultValue={editingDevice?.description || ""}
            placeholder="Description optionnelle"
          />
          <Select
            label="Groupe"
            name="groupId"
            defaultValue={editingDevice?.groupId || ""}
            options={[
              { value: "", label: "Aucun groupe" },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingDevice(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingDevice ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
