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
import { Court, uploadCourtImage, deleteCourtImage } from "@/lib/reservations";
import { useEffect, useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  onSubmit: (data: CourtFormData & { image_url?: string }) => Promise<void>;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setImageUrl(court.image_url);
    } else {
      form.reset({
        name: "",
        description: "",
        sport_type: "",
        price_per_hour: 0,
        is_active: true,
      });
      setImageUrl(null);
    }
  }, [court, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    setUploading(true);
    try {
      // Delete old image if exists
      if (imageUrl) {
        await deleteCourtImage(imageUrl);
      }
      
      const url = await uploadCourtImage(file);
      setImageUrl(url);
      toast.success("Imagen subida correctamente");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (imageUrl) {
      try {
        await deleteCourtImage(imageUrl);
        setImageUrl(null);
        toast.success("Imagen eliminada");
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error("Error al eliminar la imagen");
      }
    }
  };

  const handleSubmit = async (data: CourtFormData) => {
    await onSubmit({ ...data, image_url: imageUrl || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {court ? "Editar Cancha" : "Nueva Cancha"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto de la cancha</label>
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                    <img
                      src={imageUrl}
                      alt="Cancha"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-32 h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-muted-foreground/50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Agregar foto</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

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
              <Button type="submit" disabled={uploading}>
                {court ? "Guardar Cambios" : "Crear Cancha"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
