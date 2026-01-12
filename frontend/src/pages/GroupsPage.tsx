import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, FolderTree, Trash2, Edit, Cpu } from "lucide-react";
import { groupsApi } from "../api";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Input from "../components/Input";
import type { Group } from "../types";

const colorOptions = [
  "#e04874", // raspberry
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#84cc16", // lime
];

export default function GroupsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setIsModalOpen(false);
      setSelectedColor(colorOptions[0]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Group> }) =>
      groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setIsModalOpen(false);
      setEditingGroup(null);
      setSelectedColor(colorOptions[0]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      color: selectedColor,
    };

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setSelectedColor(group.color);
    setIsModalOpen(true);
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
            Groupes
          </h1>
          <p className="text-slate-400 mt-2">
            Organisez vos devices par groupes
          </p>
        </motion.div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Nouveau Groupe
        </Button>
      </div>

      {/* Groups Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="relative group">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${group.color}20` }}
                  >
                    <FolderTree
                      className="w-6 h-6"
                      style={{ color: group.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-slate-400 truncate mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Cpu className="w-4 h-4" />
                      <span className="text-sm">
                        {group.devices?.length || 0} device(s)
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Supprimer ce groupe ? Les devices ne seront pas supprimés."
                            )
                          ) {
                            deleteMutation.mutate(group.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Aucun groupe créé</p>
          <p className="text-sm text-slate-500 mt-2">
            Les groupes permettent d'organiser vos devices
          </p>
          <Button
            className="mt-4"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Créer un groupe
          </Button>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
          setSelectedColor(colorOptions[0]);
        }}
        title={editingGroup ? "Modifier le groupe" : "Nouveau groupe"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            name="name"
            defaultValue={editingGroup?.name}
            required
            placeholder="Salon"
          />
          <Input
            label="Description"
            name="description"
            defaultValue={editingGroup?.description || ""}
            placeholder="Description optionnelle"
          />

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-midnight-900 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingGroup(null);
                setSelectedColor(colorOptions[0]);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingGroup ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
