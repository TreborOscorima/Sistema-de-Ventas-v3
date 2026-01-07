import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Court } from "@/lib/reservations";
import { useEffect } from "react";

const courtSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  sport_type: z.string().min(1, "El tipo de deporte es requerido"),
  price_per_hour: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  is_active: z.boolean(),
});

type CourtFormData = z.infer<typeof courtSchema>;

interface CourtFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CourtFormData) => Promise<void>;
  court?: Court | null;
}

const sportTypes = [
  { value: "futbol", label: "Fútbol" },
  { value: "futbol5", label: "Fútbol 5" },
  { value: "futbol7", label: "Fútbol 7" },
  { value: "futbol11", label: "Fútbol 11" },
  { value: "padel", label: "Pádel" },
  { value: "tenis", label: "Tenis" },
  { value: "basquet", label: "Básquet" },
  { value: "voley", label: "Vóley" },
  { value: "otro", label: "Otro" },
];

export function CourtForm({ open, onClose, onSubmit, court }: CourtFormProps) {
  const form = useForm<CourtFormData>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      name: "",
      description: "",
      sport_type: "",
      price_per_hour: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (court) {
      form.reset({
        name: court.name,
        description: court.description || "",
        sport_type: court.sport_type,
        price_per_hour: court.price_per_hour,
        is_active: court.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        sport_type: "",
        price_per_hour: 0,
        is_active: true,
      });
    }
  }, [court, form]);

  const handleSubmit = async (data: CourtFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {court ? "Editar Cancha" : "Nueva Cancha"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Cancha 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Deporte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un deporte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sportTypes.map((sport) => (
                        <SelectItem key={sport.value} value={sport.value}>
                          {sport.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price_per_hour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio por Hora ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la cancha..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Las canchas inactivas no aparecen al crear reservas
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {court ? "Guardar Cambios" : "Crear Cancha"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
