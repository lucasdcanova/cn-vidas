import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, Plus, Trash2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DoctorAvailabilityManagerProps {
  doctorId: number;
}

const daysOfWeek = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

const DoctorAvailabilityManager: React.FC<DoctorAvailabilityManagerProps> = ({ doctorId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current availability
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: [`/api/doctors/${doctorId}/availability`],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/availability`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch availability");
      const data = await response.json();
      return data.availability || [];
    },
    enabled: !!doctorId,
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (slots: AvailabilitySlot[]) => {
      const response = await fetch(`/api/admin/doctors/${doctorId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update availability");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/doctors/${doctorId}/availability`] });
      toast({
        title: "Disponibilidade atualizada",
        description: "Os horários foram salvos com sucesso.",
      });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (availabilityData) {
      setSlots(availabilityData);
    }
  }, [availabilityData]);

  const addSlot = (dayOfWeek: number) => {
    const newSlot: AvailabilitySlot = {
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      isAvailable: true,
    };
    setSlots([...slots, newSlot]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
    setHasChanges(true);
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateAvailabilityMutation.mutate(slots);
  };

  const getSlotsByDay = (dayOfWeek: number) => {
    return slots.filter(slot => slot.dayOfWeek === dayOfWeek);
  };

  const hasSlotForDay = (dayOfWeek: number) => {
    return slots.some(slot => slot.dayOfWeek === dayOfWeek);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick toggles for each day */}
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => {
          const daySlots = getSlotsByDay(day.value);
          const hasSlots = daySlots.length > 0;
          const isActive = daySlots.some(slot => slot.isAvailable);

          return (
            <div
              key={day.value}
              className={cn(
                "border rounded-lg p-3 text-center cursor-pointer transition-colors",
                hasSlots && isActive
                  ? "bg-primary/10 border-primary"
                  : hasSlots
                  ? "bg-muted"
                  : "hover:bg-muted/50"
              )}
              onClick={() => {
                if (!hasSlots) {
                  addSlot(day.value);
                }
              }}
            >
              <div className="font-medium text-sm">{day.short}</div>
              {hasSlots ? (
                <Badge variant={isActive ? "default" : "secondary"} className="mt-1 text-xs">
                  {daySlots.length} slot{daySlots.length > 1 ? "s" : ""}
                </Badge>
              ) : (
                <Plus className="h-4 w-4 mx-auto mt-1 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed slot configuration */}
      <div className="space-y-4">
        {daysOfWeek.map((day) => {
          const daySlots = getSlotsByDay(day.value);
          if (daySlots.length === 0) return null;

          return (
            <Card key={day.value}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {day.label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addSlot(day.value)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar horário
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {daySlots.map((slot, slotIndex) => {
                  const globalIndex = slots.findIndex(
                    s => s === slot
                  );

                  return (
                    <div
                      key={slotIndex}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={slot.startTime}
                          onChange={(e) => updateSlot(globalIndex, "startTime", e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          {timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">até</span>
                        <select
                          value={slot.endTime}
                          onChange={(e) => updateSlot(globalIndex, "endTime", e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          {timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <Label htmlFor={`available-${globalIndex}`} className="text-sm">
                          Disponível
                        </Label>
                        <Switch
                          id={`available-${globalIndex}`}
                          checked={slot.isAvailable}
                          onCheckedChange={(checked) => updateSlot(globalIndex, "isAvailable", checked)}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSlot(globalIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button
            onClick={handleSave}
            disabled={updateAvailabilityMutation.isPending}
            className="shadow-lg"
          >
            {updateAvailabilityMutation.isPending ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityManager;