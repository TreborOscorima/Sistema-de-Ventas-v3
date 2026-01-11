import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Users, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  type: "product" | "customer" | "reservation";
  title: string;
  subtitle: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchTerm = `%${searchQuery}%`;

    try {
      const [productsRes, customersRes, reservationsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, stock")
          .ilike("name", searchTerm)
          .limit(5),
        supabase
          .from("customers")
          .select("id, name, email, phone")
          .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
          .limit(5),
        supabase
          .from("reservations")
          .select("id, customer_name, reservation_date, court_id")
          .ilike("customer_name", searchTerm)
          .limit(5),
      ]);

      const formattedResults: SearchResult[] = [];

      if (productsRes.data) {
        productsRes.data.forEach((product) => {
          formattedResults.push({
            id: product.id,
            type: "product",
            title: product.name,
            subtitle: `$${product.price} • Stock: ${product.stock}`,
          });
        });
      }

      if (customersRes.data) {
        customersRes.data.forEach((customer) => {
          formattedResults.push({
            id: customer.id,
            type: "customer",
            title: customer.name,
            subtitle: customer.email || customer.phone || "Sin contacto",
          });
        });
      }

      if (reservationsRes.data) {
        reservationsRes.data.forEach((reservation) => {
          formattedResults.push({
            id: reservation.id,
            type: "reservation",
            title: reservation.customer_name,
            subtitle: `Reserva: ${new Date(reservation.reservation_date).toLocaleDateString("es")}`,
          });
        });
      }

      setResults(formattedResults);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchAll]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);

    switch (result.type) {
      case "product":
        navigate("/productos");
        break;
      case "customer":
        navigate("/clientes");
        break;
      case "reservation":
        navigate("/reservas");
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4 text-muted-foreground" />;
      case "customer":
        return <Users className="h-4 w-4 text-muted-foreground" />;
      case "reservation":
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return "Productos";
      case "customer":
        return "Clientes";
      case "reservation":
        return "Reservas";
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos, clientes, reservas..."
            className="pl-10 input-focus"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (query) {
                setOpen(true);
              }
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover border border-border shadow-lg" 
        align="start"
        sideOffset={4}
      >
        <Command className="bg-transparent">
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query && results.length === 0 && (
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            )}
            {!loading && Object.entries(groupedResults).map(([type, items]) => (
              <CommandGroup key={type} heading={getTypeLabel(type as SearchResult["type"])}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span className="font-medium">{result.title}</span>
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
