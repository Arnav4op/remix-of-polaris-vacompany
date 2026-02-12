import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Trash2, Edit, Zap, Building2 } from "lucide-react";
import { toast } from "sonner";

interface MultiplierForm {
  name: string;
  value: number;
  description: string;
  is_active: boolean;
}

interface OperatorForm {
  name: string;
  order_index: number;
  is_active: boolean;
}

const emptyMultiplierForm: MultiplierForm = { name: "", value: 1.0, description: "", is_active: true };
const emptyOperatorForm: OperatorForm = { name: "", order_index: 0, is_active: true };

export default function AdminMultipliers() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isMultiplierDialogOpen, setIsMultiplierDialogOpen] = useState(false);
  const [editingMultiplierId, setEditingMultiplierId] = useState<string | null>(null);
  const [multiplierForm, setMultiplierForm] = useState<MultiplierForm>(emptyMultiplierForm);

  const [isOperatorDialogOpen, setIsOperatorDialogOpen] = useState(false);
  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [operatorForm, setOperatorForm] = useState<OperatorForm>(emptyOperatorForm);

  const { data: multipliers, isLoading: isLoadingMultipliers } = useQuery({
    queryKey: ["admin-multipliers"],
    queryFn: async () => {
      const { data } = await supabase.from("multiplier_configs").select("*").order("value");
      return data || [];
    },
  });

  const { data: operators, isLoading: isLoadingOperators } = useQuery({
    queryKey: ["admin-operators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("operator_configs")
        .select("*")
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });
      return data || [];
    },
  });

  const saveMultiplierMutation = useMutation({
    mutationFn: async (data: MultiplierForm & { id?: string }) => {
      const payload = {
        name: data.name,
        value: data.value,
        description: data.description,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase.from("multiplier_configs").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("multiplier_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-multipliers"] });
      toast.success(editingMultiplierId ? "Multiplier updated" : "Multiplier added");
      closeMultiplierDialog();
    },
    onError: () => toast.error("Failed to save multiplier"),
  });

  const saveOperatorMutation = useMutation({
    mutationFn: async (data: OperatorForm & { id?: string }) => {
      const payload = {
        name: data.name,
        order_index: data.order_index,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase.from("operator_configs").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("operator_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-operators"] });
      toast.success(editingOperatorId ? "Operator updated" : "Operator added");
      closeOperatorDialog();
    },
    onError: () => toast.error("Failed to save operator"),
  });

  const deleteMultiplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("multiplier_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-multipliers"] });
      toast.success("Multiplier deleted");
    },
    onError: () => toast.error("Failed to delete multiplier"),
  });

  const deleteOperatorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operator_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-operators"] });
      toast.success("Operator deleted");
    },
    onError: () => toast.error("Failed to delete operator"),
  });

  const toggleMultiplierActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("multiplier_configs").update({ is_active: !currentActive }).eq("id", id);
    if (error) {
      toast.error("Failed to toggle multiplier");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin-multipliers"] });
  };

  const toggleOperatorActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("operator_configs").update({ is_active: !currentActive }).eq("id", id);
    if (error) {
      toast.error("Failed to toggle operator");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin-operators"] });
  };

  const openEditMultiplier = (multiplier: { id: string; name: string; value: number; description: string | null; is_active: boolean | null }) => {
    setEditingMultiplierId(multiplier.id);
    setMultiplierForm({
      name: multiplier.name,
      value: Number(multiplier.value),
      description: multiplier.description || "",
      is_active: Boolean(multiplier.is_active),
    });
    setIsMultiplierDialogOpen(true);
  };

  const openEditOperator = (operatorConfig: { id: string; name: string; order_index: number; is_active: boolean }) => {
    setEditingOperatorId(operatorConfig.id);
    setOperatorForm({
      name: operatorConfig.name,
      order_index: Number(operatorConfig.order_index),
      is_active: Boolean(operatorConfig.is_active),
    });
    setIsOperatorDialogOpen(true);
  };

  const closeMultiplierDialog = () => {
    setIsMultiplierDialogOpen(false);
    setEditingMultiplierId(null);
    setMultiplierForm(emptyMultiplierForm);
  };

  const closeOperatorDialog = () => {
    setIsOperatorDialogOpen(false);
    setEditingOperatorId(null);
    setOperatorForm(emptyOperatorForm);
  };

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Manage Multipliers & Operators</h1>
          <p className="text-muted-foreground">Configure multipliers and operator dropdown options</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Multiplier Configuration</CardTitle>
            <CardDescription>{multipliers?.length || 0} multipliers configured</CardDescription>
          </div>
          <Dialog open={isMultiplierDialogOpen} onOpenChange={(open) => !open && closeMultiplierDialog()}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMultiplierId(null);
                  setMultiplierForm(emptyMultiplierForm);
                  setIsMultiplierDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />Add Multiplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMultiplierId ? "Edit Multiplier" : "Add Multiplier"}</DialogTitle>
                <DialogDescription>Configure multiplier name and value</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={multiplierForm.name}
                    onChange={(e) => setMultiplierForm({ ...multiplierForm, name: e.target.value })}
                    placeholder="Event 1.5x"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multiplier Value</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={multiplierForm.value}
                    onChange={(e) => setMultiplierForm({ ...multiplierForm, value: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={multiplierForm.description}
                    onChange={(e) => setMultiplierForm({ ...multiplierForm, description: e.target.value })}
                    placeholder="Used for special events"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={multiplierForm.is_active} onCheckedChange={(value) => setMultiplierForm({ ...multiplierForm, is_active: value })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeMultiplierDialog}>Cancel</Button>
                <Button
                  onClick={() => saveMultiplierMutation.mutate({ ...multiplierForm, id: editingMultiplierId || undefined })}
                  disabled={saveMultiplierMutation.isPending}
                >
                  {editingMultiplierId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingMultipliers ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : multipliers && multipliers.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Value</th>
                    <th className="text-left py-3 px-2 font-medium">Description</th>
                    <th className="text-left py-3 px-2 font-medium">Active</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {multipliers.map((multiplier) => (
                    <tr key={multiplier.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{multiplier.name}</td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary">{Number(multiplier.value).toFixed(1)}x</Badge>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{multiplier.description}</td>
                      <td className="py-3 px-2">
                        <Switch
                          checked={Boolean(multiplier.is_active)}
                          onCheckedChange={() => toggleMultiplierActive(multiplier.id, Boolean(multiplier.is_active))}
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditMultiplier(multiplier)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMultiplierMutation.mutate(multiplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No multipliers configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Operator Configuration</CardTitle>
            <CardDescription>{operators?.length || 0} operators configured</CardDescription>
          </div>
          <Dialog open={isOperatorDialogOpen} onOpenChange={(open) => !open && closeOperatorDialog()}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingOperatorId(null);
                  setOperatorForm(emptyOperatorForm);
                  setIsOperatorDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />Add Operator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingOperatorId ? "Edit Operator" : "Add Operator"}</DialogTitle>
                <DialogDescription>Configure operator display name and order</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={operatorForm.name}
                    onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                    placeholder="Emirates"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order Index</Label>
                  <Input
                    type="number"
                    min="0"
                    value={operatorForm.order_index}
                    onChange={(e) => setOperatorForm({ ...operatorForm, order_index: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={operatorForm.is_active} onCheckedChange={(value) => setOperatorForm({ ...operatorForm, is_active: value })} />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeOperatorDialog}>Cancel</Button>
                <Button
                  onClick={() => saveOperatorMutation.mutate({ ...operatorForm, id: editingOperatorId || undefined })}
                  disabled={saveOperatorMutation.isPending}
                >
                  {editingOperatorId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingOperators ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : operators && operators.length > 0 ? (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Order</th>
                    <th className="text-left py-3 px-2 font-medium">Active</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((operatorConfig) => (
                    <tr key={operatorConfig.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {operatorConfig.name}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{operatorConfig.order_index}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Switch
                          checked={Boolean(operatorConfig.is_active)}
                          onCheckedChange={() => toggleOperatorActive(operatorConfig.id, Boolean(operatorConfig.is_active))}
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditOperator(operatorConfig)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteOperatorMutation.mutate(operatorConfig.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No operators configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
