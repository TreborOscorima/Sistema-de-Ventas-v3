import { useEffect, useState, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Palette, Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

export const AppearanceSettings = forwardRef<HTMLDivElement>((_, ref) => {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Apariencia
        </CardTitle>
        <CardDescription>
          Personaliza la apariencia de la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label>Tema de la aplicación</Label>
          <RadioGroup
            value={theme}
            onValueChange={(value) => applyTheme(value as Theme)}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="light" id="light" className="sr-only" />
              <Sun className="h-6 w-6 mb-3" />
              <span className="text-sm font-medium">Claro</span>
            </Label>
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="dark" id="dark" className="sr-only" />
              <Moon className="h-6 w-6 mb-3" />
              <span className="text-sm font-medium">Oscuro</span>
            </Label>
            <Label
              htmlFor="system"
              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="system" id="system" className="sr-only" />
              <Monitor className="h-6 w-6 mb-3" />
              <span className="text-sm font-medium">Sistema</span>
            </Label>
          </RadioGroup>
          <p className="text-sm text-muted-foreground">
            Selecciona "Sistema" para que la aplicación siga la configuración de tu dispositivo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

AppearanceSettings.displayName = "AppearanceSettings";
